// import path from 'path';
// import { FileEditor } from '../../includes/FileEditor';
// import { Pair } from '../../config';
// import { rootDir } from '../../config';

// type StorageJSON = {
//   targetPair: Pair | null;
// };

// class Storage {
//   private _targetPair: Pair | null;
//   private path: string = path.join(rootDir, 'storage.json');

//   public toJSON(): StorageJSON {
//     return { targetPair: this._targetPair };
//   }

//   public constructor() {
//     const storage: StorageJSON = JSON.parse(FileEditor.read(this.path));

//     this._targetPair = storage.targetPair;
//   }

//   public set targetPair(pair: Pair | null) {
//     this._targetPair = pair;
//     FileEditor.write(this.path, JSON.stringify(this));
//   }

//   public get targetPair(): Pair | null {
//     return this._targetPair;
//   }
// }

// export const _storage = new Storage();
