import fs from 'fs';

export class FileEditor {
  public static read(path: string): string {
    return fs.readFileSync(path, { encoding: 'utf-8' });
  }
  public static write(path: string, text: string): void {
    return fs.writeFileSync(path, text, { encoding: 'utf-8' });
  }
}
