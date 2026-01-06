import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { geminiModel } from "@/lib/gemini";
import { NextResponse } from "next/server";

// Tech Spec: 3. TRANSLATE (번역)
// Input: WorkExperiences의 bullets_kr
// Process: LLM이 영문 번역 (Action Verbs 위주)
// Output: WorkExperiences 테이블에 bullets_en Update
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
      where: { id, user_id: session.user.id },
      include: { workExperiences: true },
    });

    if (!resume || resume.workExperiences.length === 0) {
      return new NextResponse("No experiences to translate", { status: 400 });
    }

    // Build Prompt
    const experiencesData = resume.workExperiences.map((exp) => ({
      id: exp.id,
      role_kr: exp.role_kr,
      bullets_kr: exp.bullets_kr,
    }));

    const prompt = `
    다음은 이력서의 경력 사항(JSON)이야.
    각 항목을 전문적인 "영문 이력서(Resume)" 스타일로 번역해줘.
    
    규칙:
    1. **Role**: 직무명을 적절한 영문 직무명으로 변환.
    2. **Bullets**: 각 성과를 "Action Verb"로 시작하는 강렬한 문장으로 번역.
    3. JSON 구조를 유지하고, 'role_en'과 'bullets_en' 필드를 추가해서 반환해.
    
    Input JSON:
    ${JSON.stringify(experiencesData, null, 2)}
    
    Output JSON Format:
    [
      {
        "id": "UUID",
        "role_en": "English Role",
        "bullets_en": ["Action Verb statement...", "Achieved x% growth..."]
      }
    ]
    `;

    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();

    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "");
    const translatedData = JSON.parse(cleanJson);

    // Save to DB (Transaction)
    await prisma.$transaction(async (tx) => {
      for (const item of translatedData) {
        await tx.workExperience.update({
          where: { id: item.id },
          data: {
            role_en: item.role_en,
            bullets_en: item.bullets_en,
          },
        });
      }

      // Update Status
      await tx.resume.update({
        where: { id },
        data: {
          status: "COMPLETED",
          current_step: "DONE",
        },
      });

      // Log Usage
      await tx.usageLog.create({
        data: {
          user_id: userId,
          amount: 1,
          action: "TRANSLATE",
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Translate API Error:", error);
    return new NextResponse("Failed to translate", { status: 500 });
  }
}
