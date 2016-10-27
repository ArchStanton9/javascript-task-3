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
var MINUTE = 60 * 1000;
var bankUTC;

/**
 * Создает временную отметку
 * @param {Sting} busyTime – время
 * @param {String} type - тип отметки: либо 'from' - начало дела, либо 'to' - конец дела
 * @param {String} label - имя занятого ганстера или 'bank'
 * @returns {Object}
 */
function getTimePoint(busyTime, type, label) {
    var day = busyTime.match(/^[А-Я]{2}/)[0];
    day = WEEK[day];
    var time = busyTime.match(/\d{2}:\d{2}/);
    busyTime = ['2016-10-', day, 'T', time, ':00', getUTC(busyTime).toString()].join('');
    var value = Date.parse(busyTime);
    time = getTime(value);

    return {
        type: type,
        label: label,
        time: time,
        value: value
    };
}

/**
 * Возвращает время в часовом поясе банка
 * @param {Number} value – кол-во миллисекунд прошедших с 1 января 1970 года 00:00:00 по UTC.
 * @returns {Object}
 */
function getTime(value) {
    value += bankUTC.value * HOUR;
    var date = new Date(value).toUTCString();
    var day = date.match(/^[a-z]{3}/i)[0];
    var time = date.match(/\d{2}:\d{2}:\d{2}/)[0];

    return {
        day: EN_RU_WEEK[day],
        hours: time.match(/\d{2}/g)[0],
        minutes: time.match(/\d{2}/g)[1]
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
 * Создает массив временных отметок Банды
 * @param {Object} schedule – Расписание Банды
 * @param {String} workingHours – Время работы банка
 * @returns {Object[]}
 */
function getTimePoints(schedule, workingHours) {
    var timePoints = [];
    var dayStart = ['ПН 00:00', bankUTC.value].join('+');
    var dayEnd = ['СР 23:59', bankUTC.value].join('+');

    timePoints.push(
        getTimePoint(dayStart, 'from', 'Bank'),
        getTimePoint(dayEnd, 'to', 'Bank')
    );

    Object.keys(WEEK).forEach(function (day) {
        var open = [day, workingHours.from].join(' ');
        var close = [day, workingHours.to].join(' ');

        timePoints.push(
            getTimePoint(close, 'from', 'Bank'),
            getTimePoint(open, 'to', 'Bank')
        );
    });

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
    var freeTimePoints = [];
    var robberyTimePoints = [];

    timePoints.sort(function (a, b) {
        return Math.sign(a.value - b.value);
    });

    timePoints.forEach(function (point) {
        if (point.type === 'from') {
            if (freeTimePoints.length % 2 !== 0) {
                freeTimePoints.push(point);
            }
            stack.push(point);
        }

        if (point.type === 'to') {
            stack = stack.filter(function (item) {
                return point.label !== item.label;
            });

            if (stack.length === 0) {
                freeTimePoints.push(point);
            }
        }
    });

    for (var i = 0; i < freeTimePoints.length - 1; i += 2) {
        if (freeTimePoints[i + 1].value - freeTimePoints[i].value >= duration) {
            robberyTimePoints.push(freeTimePoints[i], freeTimePoints[i + 1]);
        }
    }

    return robberyTimePoints;
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
    duration *= MINUTE;
    bankUTC = getUTC(workingHours.from);

    timePoints = timePoints.concat(getTimePoints(schedule, workingHours));
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
                var time = robberyTimePoints[0].time;

                return template
                    .replace(/(%[D][D])/, time.day)
                    .replace(/(%[H][H])/, time.hours)
                    .replace(/(%[M][M])/, time.minutes);
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
