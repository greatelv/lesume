import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { geminiModel } from "@/lib/gemini";
import { NextResponse } from "next/server";

// Tech Spec: 2. SUMMARY (요약)
// Input: 추출된 Raw Text
// Process: LLM이 경력별 핵심 성과 3~4줄 요약
// Output: WorkExperiences 테이블에 bullets_kr Insert
// Quota: 1 차감

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    const { id } = await params;
    const resume = await prisma.resume.findUnique({
      where: { id, user_id: userId },
    });

    if (!resume || !resume.raw_text) {
      return new NextResponse("Resume not found or text missing", {
        status: 404,
      });
    }

    // Call Gemini
    const prompt = `
    다음은 이력서에서 추출한 텍스트야. 
    이 텍스트를 분석해서 "회사/조직별 경력"으로 구분해줘.
    각 경력에 대해:
    1. 회사명 (한글)
    2. 직무 (한글)
    3. 근무 기간 (YYYY.MM - YYYY.MM 또는 Present)
    4. 핵심 성과 (bullets_kr): 3~4개의 핵심 성과를 "한글로" 요약해줘. 수치 위주로 작성해.
    
    결과는 반드시 JSON 배열 포맷으로만 출력해.
    Example format:
    [
      {
        "company_name_kr": "회사명",
        "role_kr": "직무",
        "start_date": "2023.01",
        "end_date": "Present",
        "bullets_kr": ["성과1", "성과2", "성과3"]
      }
    ]
    
    Resume Text:
    ${resume.raw_text}
    `;

    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();

    // Clean markdown code blocks if present
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "");
    const experiences = JSON.parse(cleanJson);

    // Save to DB (Transaction)
    await prisma.$transaction(async (tx) => {
      // Clear old experiences if re-running?
      await tx.workExperience.deleteMany({
        where: { resume_id: id },
      });

      // Insert new
      for (const exp of experiences) {
        await tx.workExperience.create({
          data: {
            resume_id: id,
            company_name_kr: exp.company_name_kr,
            role_kr: exp.role_kr,
            start_date: exp.start_date,
            end_date: exp.end_date,
            bullets_kr: exp.bullets_kr, // Prisma handles JSON
            role_en: "",
            company_name_en: "",
            bullets_en: [],
          },
        });
      }

      // Update Status
      await tx.resume.update({
        where: { id },
        data: {
          status: "PROCESSING",
          current_step: "TRANSLATE",
        },
      });

      // Log Usage
      await tx.usageLog.create({
        data: {
          user_id: userId,
          amount: 1,
          action: "SUMMARIZE",
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Summary API Error:", error);
    return new NextResponse("Failed to generate summary", { status: 500 });
  }
}
