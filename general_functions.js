/**
 * Created by Luis Soto on 27/10/18.
 */

let _ = require('lodash');

//Function to formatted duration in second from array of task to "HH:mm:ss"
module.exports.formatted_duration_from_tasks = function (tasks) {

    let duration = 0;
    _.forEach(tasks, function (task) {
        if (task.status === "Running"){ //If task is running we calculated current duration
            const started_or_last_resumed = task.last_resumed || task.createdAt;
            duration += task.duration + (new Date() - started_or_last_resumed)/1000;
        }
        else duration += task.duration; //If task is "Finished" or "Paused" duration is already calculated
    });
    const hours = String(Math.floor(duration / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((duration % 3600) / 60)).padStart(2, "0");
    const seconds = String(Math.round((duration % 3600) % 60)).padStart(2, "0");

    return {
        duration: duration,
        formatted: hours + ':' + minutes + ':' + seconds
    };
};