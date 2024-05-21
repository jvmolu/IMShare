// This is the WorkerFactory class that creates a worker from a worker function.
// The worker function is passed as an argument to the constructor.
// The worker function is converted to a string and then a blob is created from the string. 
// The worker is then created from the URL of the blob.
export default class WorkerFactory {
    constructor(workerFunction) {
      const workerCode = workerFunction.toString();
      const workerBlob = new Blob([`(${workerCode})()`]);
      return new Worker(URL.createObjectURL(workerBlob));
    }
}