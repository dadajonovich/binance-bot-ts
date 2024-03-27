// export abstract class Planner {
//   protected abstract run(): void;

//   constructor(time: string) {
//     const timeObject = new Date(`2000/${time}`);
//     const targetTime = new Date();

//     const hours = timeObject.getHours();
//     const minutes = timeObject.getMinutes();
//     const seconds = timeObject.getSeconds();
//     const milliseconds = timeObject.getMilliseconds();
//     targetTime.setHours(hours);
//     targetTime.setMinutes(minutes);
//     targetTime.setSeconds(seconds);
//     targetTime.setMilliseconds(milliseconds);

//     targetTime.setTime(
//       targetTime.getTime() - targetTime.getTimezoneOffset() * 60 * 1000,
//     );

//     const runAfter = Number(targetTime) - Date.now();

//     setTimeout(() => {
//       setInterval(() => this.run(), 1440000);
//     }, runAfter);
//   }
// }
