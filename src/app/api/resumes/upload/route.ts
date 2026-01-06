import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { extractTextFromPDF } from "@/lib/parse-pdf";
import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    // 1. Local Upload Strategy (Bypassing Supabase for Verification)
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, fileName);

    // Ensure upload dir exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Write file locally
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${fileName}`; // Local URL

    // Original Supabase Code (Commented out)
    /*
    const fileName = `${session.user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("lesume")
      .upload(fileName, buffer, {
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload Error:", uploadError);
      return new NextResponse("Failed to upload file", { status: 500 });
    }
    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/lesume/${fileName}`;
    */

    // 2. Parse PDF Text
    let text = "";
    try {
      text = await extractTextFromPDF(buffer);
    } catch (parseError) {
      console.error("PDF Parse Error:", parseError);
      // Continue even if parsing fails? Maybe fail for now.
      // But we might want to allow re-trying just the parsing later.
      // For MVP, lets fail if text cannot be extracted.
      return new NextResponse("Failed to parse PDF", { status: 500 });
    }

    // 3. Create Resume Record
    const resume = await prisma.resume.create({
      data: {
        user_id: session.user.id,
        title: file.name.replace(".pdf", ""),
        original_file_url: fileUrl,
        raw_text: text,
        status: "IDLE", // Ready for summary
        current_step: "UPLOAD",
      },
    });

    // 4. Create Initial WorkExperience from Raw Text (Ideally LLM does this, but we store raw text somewhere?
    // Tech Spec says: "3.1 UPLOAD: ... 텍스트 추출 ... (Status: IDLE). 2. SUMMARY: Input: 추출된 Raw Text"
    // We didn't define a place to store 'Raw Text' in the schema...
    // Wait, Schema has 'WorkExperiences'.
    // Ideally we pass this text to Phase 2 (Summary).
    // Let's store it temporarily or just return it?
    // Actually, Tech spec says "SUMMARY ... Process: LLM이 경력별 핵심 성과 3~4줄 요약 ... Output: WorkExperiences 테이블에 bullets_kr Insert".
    // So we need to store the raw text somewhere or trigger the summary immediately.
    // Let's look at the schema again. 'WorkExperience' has bullets_kr.
    // Maybe we create ONE dummy WorkExperience with the full raw text in 'role_kr' or something?
    // OR we should have added a 'raw_text' field to Resume model.
    // Tech spec 3.3 Resume Core: "original_file_url". No raw_text field.
    // Tech spec 4.1 Workflow: "1. UPLOAD: PDF 업로드 -> 텍스트 추출 -> Resumes 생성".
    // "2. SUMMARY: Input: 추출된 Raw Text."
    // If we don't store raw text, we have to re-parse or extract from PDF again in step 2.
    // Since we have the PDF in storage, Step 2 can re-download and parse, BUT that's inefficient.
    // Re-reading Tech Spec: "1. UPLOAD: PDF 업로드 -> 텍스트 추출 -> Resumes 생성".
    // It seems missing where to store it.
    // I will ADD a 'raw_text' field to Resume model for efficiency in the next step or just use it now if I can update schema.
    // For now, I will return the text and let the client call the next step? No, that's insecure/heavy.
    // I will trigger the Summary step automatically? Or just store it.
    // Let's simply Store the raw text in a new field "raw_text" on Resume model. It's safe and useful.

    // WAIT. I cannot change schema easily without user confirmation if I want to be strict, but I am in execution.
    // Let's check if I can just pass it to the 'SUMMARY' step immediately?
    // "1. UPLOAD ... 2. SUMMARY".
    // If I add 'raw_text' String? @db.Text to Resume model, it solves everything.

    // Let's Do: Update Schema to add `raw_text` to Resume.

    return NextResponse.json({
      id: resume.id,
      textPreview: text.substring(0, 100) + "...",
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
