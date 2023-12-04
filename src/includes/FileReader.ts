import fs from 'fs';

export class FileReader {
  public static read(path: string): string {
    return fs.readFileSync(path, { encoding: 'utf-8' });
  }
}
