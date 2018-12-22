import { execFile } from 'child_process';

class HclPrettier {
  constructor(hclstring) {
    this.hcl = hclstring;
  }

  format() {
    return new Promise((resolve, reject) => {
      const cp = execFile('terraform', ['fmt', '-'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'inherit'],
      });
      let string = '';
      cp.stdout.on('data', (part) => {
        string += part;
      });

      cp.stdout.on('end', () => {
        resolve(string);
      });

      cp.stdout.on('error', (err) => {
        reject(err);
      });

      cp.stdin.write(this.hcl);
      cp.stdin.end();
    });
  }
}
export default HclPrettier;
