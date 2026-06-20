import fs from 'fs';
import path from 'path';

const searchStr = 'https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Home%20Page/1.jpeg';
const replaceStr = 'https://res.cloudinary.com/duobc58vr/image/upload/v1781941751/1.jpg_1_gaqvnn.jpg';

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walkDir(file));
    } else { 
      results.push(file);
    }
  });
  return results;
}

const files = walkDir(path.resolve(process.cwd(), 'src'));

let replacedCount = 0;
files.forEach(file => {
  if (file.endsWith('.jsx') || file.endsWith('.css') || file.endsWith('.js')) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(searchStr)) {
      const newContent = content.split(searchStr).join(replaceStr);
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Updated: ${file}`);
      replacedCount++;
    }
  }
});

console.log(`Replaced logo in ${replacedCount} files!`);
