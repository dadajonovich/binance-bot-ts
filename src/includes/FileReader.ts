import fs from 'fs';

export class FileReader {
  public static read(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(path, { encoding: 'utf-8' }, (error, data) => {
        if (error) {
          return reject(error);
        }

        resolve(data);
      });
    });
  }
}
