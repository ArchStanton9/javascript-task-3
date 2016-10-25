'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

var WEEK = {
    ПН: 10,
    ВТ: 11,
    СР: 12
};

var EN_RU_WEEK = {
    Mon: 'ПН',
    Tue: 'ВТ',
    Wed: 'СР'
};

var HOUR = 60 * 60 * 1000;
var bankUTC;

/**
 * Создает временную отметку
 * @param {Sting} busyTime – время
 * @param {String} type - тип отметки: либо 'from' - начало дела, либо 'to' - конец дела
 * @param {String} label - имя занятого ганстера или 'bank'
 * @returns {Object}
 */
function getTimePoint(busyTime, type, label) {
    function getTime(value) {
        value += bankUTC.value * HOUR;
        var date = new Date(value).toUTCString();
        var day = date.match(/^[a-z]{3}/i)[0];
        var time = date.match(/\d\d:\d\d:\d\d/)[0];

        return {
            day: EN_RU_WEEK[day],
            hours: time.match(/\d\d/g)[0],
            minutes: time.match(/\d\d/g)[1]
        };
    }

    var day = busyTime.match(/^[А-Я][А-Я]/)[0];
    day = WEEK[day];
    var hour = busyTime.match(/\d\d:\d\d/);
    busyTime = '2016-10-' + day + 'T' + hour + ':00' + getUTC(busyTime).toString();
    var value = Date.parse(busyTime);
    var time = getTime(value);

    return {
        type: type,
        label: label,
        time: time,
        value: value
    };
}

/**
 * Возвращает Object со свойством value и методом toString,
 * который вернет часовой пояс в формате ISO 8601 (например +0500).
 * @param {String} time – Время события, например 'ПН 10:00+5'
 * @returns {Object}
 */
function getUTC(time) {
    var UTC = time.match(/\d$/);
    if (UTC === null) {
        return '';
    }
    var value = parseInt(UTC);
    UTC = UTC[0].length > 1 ? UTC : '0' + UTC;

    return {
        value: value,
        toString: function () {
            return '+' + UTC + '00';
        }
    };
}

/**
 * Создает массив временных отметок банка
 * @param {String} workingHours – Время работы банка
 * @returns {Object[]}
 */
function getBankTimePoints(workingHours) {
    var timePoints = [];
    var dayStart = 'ПН 00:00+' + bankUTC.value;
    var dayEnd = 'СР 23:59+' + bankUTC.value;

    timePoints.push(
        getTimePoint(dayStart, 'from', 'Bank'),
        getTimePoint(dayEnd, 'to', 'Bank')
    );

    Object.keys(WEEK).forEach(function (day) {
        var open = day + ' ' + workingHours.from;
        var close = day + ' ' + workingHours.to;

        timePoints.push(
            getTimePoint(close, 'from', 'Bank'),
            getTimePoint(open, 'to', 'Bank')
        );
    });

    return timePoints;
}

/**
 * Создает массив временных отметок Банды
 * @param {Object} schedule – Расписание Банды
 * @returns {Object[]}
 */
function getGangTimePoints(schedule) {
    var timePoints = [];
    Object.keys(schedule).forEach(function (robber) {
        schedule[robber].forEach(function (busyTime) {
            timePoints.push(
                getTimePoint(busyTime.from, 'from', robber),
                getTimePoint(busyTime.to, 'to', robber)
            );
        });
    });

    return timePoints;
}

/**
 * Возвращает массив отметок времени в которые можно начать ограбление
 * @param {Object[]} timePoints - массив временных отметок
 * @param {Number} duration - время ограбления
 * @returns {Object[]}
 */
function getRobberyTimePoints(timePoints, duration) {
    var stack = [];
    var robberyTimePoints = [];

    timePoints.sort(function (a, b) {
        if (a.value < b.value) {
            return -1;
        }
        if (a.value > b.value) {
            return 1;
        }

        return 0;
    });

    timePoints.forEach(function (point) {
        if (point.type === 'from') {
            if (robberyTimePoints.length % 2 !== 0) {
                robberyTimePoints.push(point);
            }
            stack.push(point);
        }

        if (point.type === 'to') {
            stack = stack.filter(function (item) {
                return point.label !== item.label;
            });

            if (stack.length === 0) {
                robberyTimePoints.push(point);
            }
        }
    });

    function selectByDuration() {
        var points = [];
        for (var i = 0; i < robberyTimePoints.length - 1; i += 2) {
            if (robberyTimePoints[i + 1].value - robberyTimePoints[i].value >= duration) {
                points.push(robberyTimePoints[i]);
                points.push(robberyTimePoints[i + 1]);
            }
        }

        return points;
    }

    return selectByDuration();
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);

    var timePoints = []; // TimePoint.Keys: type, time, value, label
    var robberyTimePoints = [];
    duration = duration * 60 * 1000;
    bankUTC = getUTC(workingHours.from);

    timePoints = timePoints.concat(getBankTimePoints(workingHours));
    timePoints = timePoints.concat(getGangTimePoints(schedule));
    robberyTimePoints = getRobberyTimePoints(timePoints, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (robberyTimePoints.length === 0) {
                return false;
            }

            return true;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (robberyTimePoints.length !== 0) {
                var date = robberyTimePoints[0].time;

                var dayRE = RegExp('(%[D][D])');
                var hoursRE = RegExp('(%[H][H])');
                var minutesRE = RegExp('(%[M][M])');

                return template
                    .replace(dayRE, date.day)
                    .replace(hoursRE, date.hours)
                    .replace(minutesRE, date.minutes);
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {

            return false;
        }
    };
};
