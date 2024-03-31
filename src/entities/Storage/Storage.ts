import path from 'path';
import { FileEditor } from '../../includes/FileEditor';
import { Pair } from '../../config';
import { rootDir } from '../../config';

type StorageJSON = {
  targetPair: Pair;
};

class Storage {
  private _targetPair: Pair;
  private path: string = path.join(rootDir, 'storage.json');

  public toJSON(): StorageJSON {
    return { targetPair: this._targetPair };
  }

  public constructor() {
    const storage: StorageJSON = JSON.parse(FileEditor.read(this.path));

    this._targetPair = storage.targetPair;
  }

  public set targetPair(pair: Pair) {
    this._targetPair = pair;
    FileEditor.write(this.path, JSON.stringify(this));
  }

  public get targetPair(): Pair {
    return this._targetPair;
  }
}

export const storage = new Storage();
