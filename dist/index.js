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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __importDefault(require("@actions/core"));
const s3_1 = __importDefault(require("aws-sdk/clients/s3"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const klaw_sync_1 = __importDefault(require("klaw-sync"));
const mime_types_1 = require("mime-types");
const AWS_KEY_ID = core_1.default.getInput('aws_key_id', {
    required: true
});
const SECRET_ACCESS_KEY = core_1.default.getInput('aws_secret_access_key', {
    required: true
});
const BUCKET = core_1.default.getInput('aws_bucket', {
    required: true
});
const SOURCE_DIR = core_1.default.getInput('source_dir', {
    required: true
});
const DESTINATION_DIR = core_1.default.getInput('destination_dir', {
    required: false
});
const ENDPOINT = core_1.default.getInput('endpoint', {
    required: false
});
const CACHE_CONTROL = core_1.default.getInput('cache', {
    required: false
});
const s3 = new s3_1.default({
    accessKeyId: AWS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
    endpoint: ENDPOINT,
});
const destinationDir = DESTINATION_DIR ? DESTINATION_DIR : '';
const paths = klaw_sync_1.default(SOURCE_DIR, {
    nodir: true
});
function upload(params) {
    return new Promise(resolve => {
        s3.upload(params, (err, data) => {
            if (err)
                core_1.default.error(err);
            core_1.default.info(`uploaded - ${data.Key}`);
            core_1.default.info(`located - ${data.Location}`);
            resolve(data.Location);
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const sourceDir = path_1.default.join(process.cwd(), SOURCE_DIR);
        core_1.default.info("Starting Miaxos/s3");
        const results = yield Promise.all(paths.map(p => {
            const fileStream = fs_1.default.createReadStream(p.path);
            const bucketPath = destinationDir === '' ? path_1.default.relative(sourceDir, p.path) : path_1.default.join(destinationDir, path_1.default.relative(sourceDir, p.path));
            console.log('bucketKey', bucketPath);
            console.log(destinationDir);
            console.log(path_1.default.relative(sourceDir, p.path));
            const params = {
                Bucket: BUCKET,
                ACL: 'public-read',
                Body: fileStream,
                Key: bucketPath,
                CacheControl: CACHE_CONTROL ? CACHE_CONTROL : undefined,
                ContentType: mime_types_1.lookup(p.path) || 'text/plain'
            };
            return upload(params);
        }));
        core_1.default.info(`object key - ${destinationDir}`);
        core_1.default.info(`object locations - ${results}`);
        core_1.default.setOutput('object_key', destinationDir);
        core_1.default.setOutput('object_locations', results);
        core_1.default.info("BORDEL DE MERDE FONCTIONNE");
    });
}
run().catch(err => {
    core_1.default.info("Error");
    core_1.default.info(err);
    core_1.default.error(err);
    core_1.default.setFailed(err.message);
});
