/**
 * @description This is the WorkerFactory class that creates a worker from a worker function.
 * The worker function is passed as an argument to the constructor.
 * The worker function is converted to a string and then a blob is created from the string. 
 * The worker is then created from the URL of the blob.
**/
class WorkerFactory {

  /**
   * @param {Function} workerFunction - The worker function
   * @returns {Worker} The worker object
   * @description This function creates a worker from a worker function.
  **/
  constructor(workerFunction) {
    const workerCode = workerFunction.toString();
    const workerBlob = new Blob([`(${workerCode})()`]);
    return new Worker(URL.createObjectURL(workerBlob));
  }

  /**
   * @returns {Worker} The worker object
   * @description This function creates a save chunk worker.
  **/
  static createSaveChunkWorker() {
    return new WorkerFactory(mySaveChunkWorker);
  }

  /**
   * @returns {Worker} The worker object
   * @description This function creates an upload worker. 
  **/
  static createUploadWorker() {
    return new WorkerFactory(myUploadChunkWorker);
  }

}