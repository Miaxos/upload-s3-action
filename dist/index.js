"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const core = __importStar(require("@actions/core"));
const s3_1 = __importDefault(require("aws-sdk/clients/s3"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const klaw_sync_1 = __importDefault(require("klaw-sync"));
const mime_types_1 = require("mime-types");
const AWS_KEY_ID = core.getInput('aws_key_id', {
    required: true,
});
const SECRET_ACCESS_KEY = core.getInput('aws_secret_access_key', {
    required: true,
});
const BUCKET = core.getInput('aws_bucket', {
    required: true,
});
const SOURCE_DIR = core.getInput('source_dir', {
    required: true,
});
const DESTINATION_DIR = core.getInput('destination_dir', {
    required: false,
});
const ENDPOINT = core.getInput('endpoint', {
    required: false,
});
const CACHE_CONTROL = core.getInput('cache', {
    required: false,
});
const s3 = new s3_1.default({
    accessKeyId: AWS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
    endpoint: ENDPOINT,
});
const destinationDir = DESTINATION_DIR || '';
const paths = klaw_sync_1.default(SOURCE_DIR, {
    nodir: true,
});
function upload(params) {
    return new Promise((resolve) => {
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
        try {
            const sourceDir = path.join(process.cwd(), SOURCE_DIR);
            core.info('Starting Miaxos/s3');
            const results = yield Promise.all(paths.map((p) => {
                const fileStream = fs.createReadStream(p.path);
                const bucketPath = destinationDir === ''
                    ? path.relative(sourceDir, p.path)
                    : path.join(destinationDir, path.relative(sourceDir, p.path));
                console.log('bucketKey', bucketPath);
                console.log(destinationDir);
                console.log(path.relative(sourceDir, p.path));
                const params = {
                    Bucket: BUCKET,
                    ACL: 'public-read',
                    Body: fileStream,
                    Key: bucketPath,
                    CacheControl: CACHE_CONTROL || undefined,
                    ContentType: mime_types_1.lookup(p.path) || 'text/plain',
                };
                return upload(params);
            }));
            core.info(`object key - ${destinationDir}`);
            core.info(`object locations - ${results}`);
            core.setOutput('object_key', destinationDir);
            core.setOutput('object_locations', results);
            process.exit(0);
        }
        catch (err) {
            core.info('Error');
            core.info(err);
            core.error(err);
            core.setFailed(err.message);
        }
    });
}
run();
