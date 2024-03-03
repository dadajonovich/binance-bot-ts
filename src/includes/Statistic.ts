export class Statistic {
  public static getStd(data: number[], length = data.length): number[] {
    const arrStd: number[] = [];
    for (let i = 0; i <= data.length - length; i++) {
      const sliceData = data.slice(i, i + length);
      const mean = sliceData.reduce((a, b) => a + b) / length;
      arrStd.push(
        Math.sqrt(
          sliceData.reduce((sq, n) => sq + (n - mean) ** 2, 0) / length,
        ),
      );
    }
    return arrStd;
  }

  public static getValueBetweenPeriods(array: number[]): number[] {
    const valueDifferences = [];
    for (let i = 1; i < array.length; i++) {
      const difference = array[i] - array[i - 1];
      valueDifferences.push(difference);
    }
    return valueDifferences;
  }
}
