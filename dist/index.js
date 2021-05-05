"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const core = require('@actions/core');
const S3 = require('aws-sdk/clients/s3');
const fs = require('fs');
const path = require('path');
const shortid = require('shortid');
const klawSync = require('klaw-sync');
const { lookup } = require('mime-types');
const AWS_KEY_ID = core.getInput('aws_key_id', {
    required: true
});
const SECRET_ACCESS_KEY = core.getInput('aws_secret_access_key', {
    required: true
});
const BUCKET = core.getInput('aws_bucket', {
    required: true
});
const SOURCE_DIR = core.getInput('source_dir', {
    required: true
});
const DESTINATION_DIR = core.getInput('destination_dir', {
    required: false
});
const ENDPOINT = core.getInput('endpoint', {
    required: false
});
const CACHE_CONTROL = core.getInput('cache', {
    required: false
});
const s3 = new S3({
    accessKeyId: AWS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
    endpoint: ENDPOINT,
});
const destinationDir = DESTINATION_DIR ? DESTINATION_DIR : '';
const paths = klawSync(SOURCE_DIR, {
    nodir: true
});
function upload(params) {
    return new Promise(resolve => {
        s3.upload(params, (err, data) => {
            if (err)
                core.error(err);
            core.info(`uploaded - ${data.Key}`);
            core.info(`located - ${data.Location}`);
            resolve(data.Location);
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const sourceDir = path.join(process.cwd(), SOURCE_DIR);
        core.info("Starting Miaxos/s3");
        const results = yield Promise.all(paths.map(p => {
            const fileStream = fs.createReadStream(p.path);
            const bucketPath = destinationDir === '' ? path.relative(sourceDir, p.path) : path.join(destinationDir, path.relative(sourceDir, p.path));
            console.log('bucketKey', bucketPath);
            console.log(destinationDir);
            console.log(path.relative(sourceDir, p.path));
            const params = {
                Bucket: BUCKET,
                ACL: 'public-read',
                Body: fileStream,
                Key: bucketPath,
                CacheControl: CACHE_CONTROL ? CACHE_CONTROL : undefined,
                ContentType: lookup(p.path) || 'text/plain'
            };
            return upload(params);
        }));
        core.info(`object key - ${destinationDir}`);
        core.info(`object locations - ${results}`);
        core.setOutput('object_key', destinationDir);
        core.setOutput('object_locations', results);
        core.info("BORDEL DE MERDE FONCTIONNE");
    });
}
run().catch(err => {
    core.info("Error");
    core.info(err);
    core.error(err);
    core.setFailed(err.message);
});
