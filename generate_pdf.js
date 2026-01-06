const PDFDocument = require("pdfkit");
const fs = require("fs");

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream("test-resume.pdf"));

doc.fontSize(25).text("홍길동 (Hong Gil Dong)", 100, 100);

doc.fontSize(16).text("Work Experience", 100, 160);

doc.fontSize(14).text("ABC Tech Corp", 100, 200);
doc.fontSize(12).text("Senior Software Engineer | 2020.01 - Present");
doc.list([
  "Designed and implemented a scalable microservices architecture using Node.js and Kubernetes.",
  "Reduced API latency by 40% through aggressive caching strategies.",
  "Led a team of 5 developers to deliver the project 2 weeks ahead of schedule.",
]);

doc.moveDown();
doc.fontSize(14).text("XYZ Solutions", 100, 350);
doc.fontSize(12).text("Software Developer | 2018.03 - 2019.12");
doc.list([
  "Developed full-stack web applications using React and Django.",
  "Implemented automated testing pipelines, increasing code coverage to 90%.",
  "Optimized database queries, reducing page load times by 2 seconds.",
]);

doc.end();
console.log("PDF created successfully");
