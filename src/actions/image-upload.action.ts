// // export const config = {
// //     api: {
// //         bodyParser: false, // dùng form-data thì cần tắt bodyParser
// //     },
// // };

// import formidable from 'formidable';
// import fs from 'fs';

// export default async function handler(req, res) {
//     if (req.method !== 'POST') {
//         return res.status(405).end('Method Not Allowed');
//     }

//     const form = new formidable.IncomingForm({ multiples: false });

//     form.parse(req, async (err, fields, files) => {
//         if (err) return res.status(500).json({ error: 'Error parsing file' });

//         const file = files.image;
//         const imageData = fs.readFileSync(file.filepath, { encoding: 'base64' });

//         const imgbbKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
//         const imgbbEndpoint = 'https://api.imgbb.com/1/upload';

//         const params = new URLSearchParams();
//         params.append('key', imgbbKey);
//         params.append('image', imageData);

//         const uploadRes = await fetch(imgbbEndpoint, {
//             method: 'POST',
//             body: params,
//         });

//         const json = await uploadRes.json();

//         if (json.success) {
//             return res.status(200).json({ url: json.data.url });
//         } else {
//             return res.status(500).json({ error: 'Upload failed' });
//         }
//     });
// }
