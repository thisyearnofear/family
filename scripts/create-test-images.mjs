import fs from "fs";
import path from "path";

// Create test directory
const testDir = path.join(process.cwd(), "test-images");
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Create 3 test images with different content
for (let i = 1; i <= 3; i++) {
  const content = Buffer.from(`Test image ${i} content`);
  fs.writeFileSync(path.join(testDir, `test${i}.jpg`), content);
  console.log(`Created test${i}.jpg`);
}
