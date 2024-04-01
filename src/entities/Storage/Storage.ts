import path from 'path';
import { FileEditor } from '../../includes/FileEditor';
import { Pair } from '../../config';
import { rootDir } from '../../config';

type StorageJSON = {
  targetPair: Pair;
  balanceUsdt: number;
};

class Storage {
  private _targetPair: Pair;
  private _balanceUsdt: number;
  private path: string = path.join(rootDir, 'storage.json');

  public toJSON(): StorageJSON {
    return { targetPair: this._targetPair, balanceUsdt: this._balanceUsdt };
  }

  public constructor() {
    const storage: StorageJSON = JSON.parse(FileEditor.read(this.path));

    this._targetPair = storage.targetPair;
    this._balanceUsdt = storage.balanceUsdt;
  }

  public set targetPair(pair: Pair) {
    this._targetPair = pair;
    FileEditor.write(this.path, JSON.stringify(this));
  }

  public get targetPair(): Pair {
    return this._targetPair;
  }

  public get balanceUsdt(): number {
    return this._balanceUsdt;
  }

  public set balanceUsdt(balance: number) {
    this._balanceUsdt = balance;
    FileEditor.write(this.path, JSON.stringify(this));
  }
}

export const storage = new Storage();
