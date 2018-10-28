let _ = require('lodash');

module.exports.formatted_duration_from_tasks = function (tasks) {

    let duration = 0;
    _.forEach(tasks, function (task) {
        if (task.status === "Running"){
            const started_or_last_resumed = task.last_resumed || task.createdAt;
            duration += task.duration + (new Date() - started_or_last_resumed)/1000;
        }
        else duration += task.duration;
    });
    const hours = String(Math.floor(duration / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((duration % 3600) / 60)).padStart(2, "0");
    const seconds = String(Math.round((duration % 3600) % 60)).padStart(2, "0");

    return {
        duration: duration,
        formatted: hours + ':' + minutes + ':' + seconds
    };
};