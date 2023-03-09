import http from "http";
import fs, {readFileSync, accessSync, constants } from "fs";
import mime from "mime";
const cache = new Map(); //用来缓存文件对象
const server = http.createServer();
const port = 3005;
server.addListener('request', generateResponse);
server.listen(port, ()=>{
    console.log(`server running on http://localhost:${port}`);
})

//获取文件绝对位置
function transferFileUrl(req) {
    let filePath = req.url;
    if (filePath == '/') {
        filePath = 'public/index.html';
    } else {
        filePath = `public${req.url}`;
    }
    return `./${filePath}`;
}

//判断文件存在
function assertFileReadExist(absPath) {
    if (cache.has(absPath)) {
        return true;
    }
    try {
        accessSync(absPath, constants.R_OK);
        return true;
    } catch(err) {
        return false
    }
}

//请求处理流程
function generateResponse(req, res) {
   const absPath = transferFileUrl(req);
   const fileFound = assertFileReadExist(absPath);
   if (fileFound) {
    sendFile(res, absPath);
   } else {
    send404(res);
   }
}

//404 response
function send404(res) {
    res.writeHead(404, {
        'Content-Type': 'text-plain'
    });
    res.write('Error code 404, file not found');
    res.end();
}

function sendFile(res, absPath) {
    const fileMime = mime.getType(absPath);
    if (cache.has(absPath)) {
        res.writeHead(200, {
            'Content-Type': fileMime
        })
        console.log(`${absPath} come from cache`);
        res.end(cache.get(absPath));
    } else {
        const fileContent = readFileSync(absPath);
        if (fileContent) {
            res.writeHead(200, {
                'Content-Type': fileMime
            })
            cache.set(absPath, fileContent);
            console.log(`${absPath} come from read file success`);
            res.end(fileContent);
        } else {
            send404(res);
        }
    }
}