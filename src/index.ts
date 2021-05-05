import * as core from '@actions/core';
import S3 from 'aws-sdk/clients/s3';
import * as fs from 'fs';
import * as path from 'path';
import klawSync from 'klaw-sync';
import { lookup } from 'mime-types';

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

const s3 = new S3({
  accessKeyId: AWS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
  endpoint: ENDPOINT,
});
const destinationDir = DESTINATION_DIR || '';
const paths = klawSync(SOURCE_DIR, {
  nodir: true,
});

function upload(params) {
  return new Promise((resolve) => {
    s3.upload(params, (err, data) => {
      if (err) core.error(err);
      core.info(`uploaded - ${data.Key}`);
      core.info(`located - ${data.Location}`);
      resolve(data.Location);
    });
  });
}

async function run() {
  try {
    const sourceDir = path.join(process.cwd(), SOURCE_DIR);
    core.info('Starting Miaxos/s3');
    const results = await Promise.all(
      paths.map((p) => {
        const fileStream = fs.createReadStream(p.path);
        const bucketPath =
          destinationDir === ''
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
          ContentType: lookup(p.path) || 'text/plain',
        };
        return upload(params);
      }),
    );

    core.info(`object key - ${destinationDir}`);
    core.info(`object locations - ${results}`);
    core.setOutput('object_key', destinationDir);
    core.setOutput('object_locations', results);
    return results;
  } catch (err) {
    core.info('Error');
    core.info(err);
    core.error(err);
    core.setFailed(err.message);
  }
}

run();
