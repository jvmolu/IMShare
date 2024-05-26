import saveChunkWorker from "./save-chunk-worker";
import uploadWorker from "./upload-worker";

/**
 * @description This is the WorkerFactory class that creates a worker from a worker function.
 * The worker function is passed as an argument to the constructor.
 * The worker function is converted to a string and then a blob is created from the string. 
 * The worker is then created from the URL of the blob.
**/
export default class WorkerFactory {

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
  createSaveChunkWorker() {
    return new WorkerFactory(saveChunkWorker);
  }

  /**
   * @returns {Worker} The worker object
   * @description This function creates an upload worker. 
  **/
  createUploadWorker() {
    return new WorkerFactory(uploadWorker);
  }

}