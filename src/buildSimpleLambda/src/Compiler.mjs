import MemoryFs from 'memory-fs';
import webpack from 'webpack';
import fs from 'fs-extra';
import { join } from 'path';
import makeWebpackConfig from './webpack.config';

class Compiler {
  constructor(id, webpackSettings) {
    this.compiler = webpack(makeWebpackConfig(webpackSettings));
    this.fs = new MemoryFs();
    this.compiler.outputFileSystem = this.fs;
    this.id = id;
  }

  run(buildDir) {
    const { id } = this;
    return new Promise((resolve, reject) => {
      this.compiler.run((err, stats) => {
        const statsFile = join(buildDir, `${id}_webpack_stats.json`);
        const cliOutputFile = join(buildDir, `${id}_webpack_output.log`);
        const errFile = join(buildDir, `${id}_webpack_errors.json`);
        fs.writeFileSync(statsFile, JSON.stringify(stats.toJson(), null, 2));
        fs.writeFileSync(cliOutputFile, stats.toString());

        if (err || stats.hasErrors()) {
          fs.writeFileSync(errFile, err);
          reject(
            new Error(
              `There were some webpack errors, please check ${id}_webpack_output.log\n`,
            ),
          );
        } else {
          resolve({
            err, stats, id, fs: this.fs,
          });
        }
      });
    });
  }
}

export default Compiler;
