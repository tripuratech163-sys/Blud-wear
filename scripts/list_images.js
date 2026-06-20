import fs from 'fs';
import { parse } from 'csv-parse';

const listImages = async () => {
  fs.createReadStream('old_products.csv')
    .pipe(parse({ columns: true, skip_empty_lines: true }))
    .on('data', (row) => {
      console.log(`\n**Product:** ${row.name}`);
      console.log(`- Main Image: ${row.image.split('Bludwear/')[1] || row.image}`);
      
      let images = [];
      try {
        if (row.images) images = JSON.parse(row.images);
        if (images.length > 0) {
            console.log(`- Gallery Images:`);
            images.forEach(img => {
                console.log(`  * ${img.split('Bludwear/')[1] || img}`);
            });
        }
      } catch (e) {}
    })
    .on('end', () => {
        console.log('\nDone listing images.');
    });
};

listImages();
