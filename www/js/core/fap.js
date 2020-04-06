class FAP {
    constructor (core) {
        console.log('initialize fap');
        this.core = core;
        this.FAP_URL = "http://fap.greenwich.edu.vn";
        this.browser = cordova.InAppBrowser.open(this.FAP_URL, '_blank', 'location=yes');
        this.browser.hide();
        this.isReady = false;
        this.isLoggedIn = false;
        this.cookieString = "";
        this.parser = new DOMParser();

        this.__VIEWSTATE = "";
        this.__EVENTARGUMENT = "";
        this.__LASTFOCUS = "";
        this.__VIEWSTATE = "";
        this.__EVENTVALIDATION = "";

        this.browser.addEventListener('loadstop', e => {
            if (!this.isReady) {
                this.isReady = true;
                this.init();
            }
        });

        this.campus = [{
            id: 3,
            name: "Greenwich Hà Nội"
        }, {
            id: 5,
            name: "Greenwich Đà Nẵng"
        }, {
            id: 6,
            name: "Greenwich Cần Thơ"
        }, {
            id: 4,
            name: "Greenwich Hồ Chí Minh"
        }];
        this.campus.forEach(camp => {
            $("#sel-locations").append(`<option value="${camp.id}">${camp.name}</option>`);
        });
        $("#sel-locations").val(this.campus[0].id);

    }

    init() {
        $(".button-login").on('click', e => {
            app.preloader.show();
            let campusId = $("#sel-locations").val();
            this.selectCampus(campusId).then(() => {
                this.login().then(() => {
                    this.getCookies().then(cookieString => {
                        this.core.cookieString = cookieString;
                        this.getStudentInfo().then(studentInfo => {
                            $('.student-avatar').attr('src', 'data:image/png;base64,' + studentInfo.avatar);
                            $('.student-name').text(studentInfo.name);
                            $('.student-email').text(studentInfo.email);
                            $('.student-code').text(studentInfo.student_code);
                        });
                        this.browser.close();
                        this.renderTimeTable().then(() => {
                            this.getNews().then(newsList => {
                                newsList.forEach(news => {
                                    $("#notifications-area").append(`<li>
                                  <a href="#" class="item-link item-content item-news" data-news="${news.link}">
                                    <div class="item-inner">
                                      <div class="item-title">
                                        <div class="item-header">${news.time}</div>
                                        ${news.title}
                                      </div>
                                    </div>
                                  </a>
                                </li>`);
                                });
                            });
                        });
                        this.renderTermCourses();
                    });
                })
            });
        });
    }

    renderTimeTable(weekNumber = '') {
        return new Promise((resolve, reject) => {
            let days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
            let nowDayInWeek = new Date().getDay() - 1;
            if (nowDayInWeek === -1) nowDayInWeek = 6;
            app.preloader.show();
            this.getWeekClasses(weekNumber).then(weeklyData => {
                $('.week-list').html('');
                $("#weekly-timetable").html('');
                let weeksList = weeklyData.weeks;
                let weeklyTimeTable = weeklyData.timeTable;
                weeklyTimeTable.forEach((dailyTimeTable, dayIndex) => {
                    let slotsHTML = '';
                    let state = '';
                    if (dailyTimeTable.some(x => x.attendStatus === 'absent')) {
                        state = "absent";
                    } else if (nowDayInWeek > dayIndex) {
                        state = "attended";
                    } else {
                        state = "not-yet";
                    }
                    dailyTimeTable.forEach(slot => {
                        let slotState = '';
                        if (slot.attendStatus === 'attended') {
                            slotState = 'attended';
                        } else if (slot.attendStatus === 'Not yet') {
                            slotState = 'not-yet';
                        } else {
                            slotState = 'absent';
                        }
                        slot.slotTime = slot.slotTime.replace('(', '').replace(')', '').replace('-',' - ');
                        slot.className = slot.className.replace('(', ' (');
                        if (slot.slotTime !== '') {
                            slot.startTime = slot.slotTime.split(' - ')[0];
                            slot.endtTime = slot.slotTime.split(' - ')[1];
                            // start time
                            slot.startHour = slot.startTime.split(':')[0];
                            slot.startMinute = slot.startTime.split(':')[1];
                            // end time
                            slot.endHour = slot.endtTime.split(':')[0];
                            slot.endMinute = slot.endtTime.split(':')[1];
                        }

                        slotsHTML += `<div class="timeline-item-inner elevation-0 ${slotState}" data-week-number="${weekNumber}" data-day-number="${dayIndex}">
                            <div class="timeline-item-time">${slot.slotTime} ${slot.classLocation}</div>
                            <b>${slot.className}</b>
                        </div>`;
                    });
                    if (slotsHTML === '') slotsHTML = "<i>Không có tiết học nào...</i>";
                    let dailyHTML = `<div class="timeline-item">
                        <div class="timeline-item-date ${nowDayInWeek === dayIndex ? 'today' : ''}">${days[dayIndex]}</div>
                        <div class="timeline-item-divider ${state}"></div>
                        <div class="timeline-item-content">
                            ${slotsHTML}
                        </div>
                    </div>`;
                    $("#weekly-timetable").append(dailyHTML);
                });

                let selectedIndex = weeksList.findIndex(x => x.selected === true) || 0;
                let firstIndex = selectedIndex - 1 >= 0 ? selectedIndex - 1 : 0;
                let endIndex = firstIndex + 10 > weeksList.length ? weeksList.length : firstIndex + 10;

                for (let i = firstIndex; i <= endIndex; i++) {
                    $('.week-list').append(`<a class="select-week ${weeksList[i].selected ? 'selected' : ''}" data-week="${weeksList[i].value}">${weeksList[i].text}</a>`);
                }

                app.preloader.hide();
                app.popup.close('.login-screen');
                resolve();
            });
        });
    }

    renderTermCourses(url = '') {
        $('.course-grade-block').hide();
        this.loadStudentGradeCourses(url).then(gradeCourses => {
            app.preloader.hide();
            $('#terms-list').html('');
            $('#courses-list').html('');
            gradeCourses.terms.forEach(term => {
                $('#terms-list').append(`<li>
                    <a href="#" class="item-link item-content load-term" data-link="${term.link}" data-selected="${term.selected}">
                        <div class="item-media">
                            <i class="material-icons">data_usage</i>
                        </div>
                        <div class="item-inner">
                            <div class="item-title">
                                <div class="item-header">Học kỳ</div>
                                ${term.name}
                            </div>
                        </div>
                    </a>
                </li>`);
            });
            gradeCourses.courses.forEach(course => {
                let courseName = course.name.split(') (')[0] + ')';
                let courseInfo = course.name.split(') (')[1].replace(')', '');
                $('#courses-list').append(`<li>
                    <a href="#" class="item-link item-content load-course" data-link="${course.link}">
                        <div class="item-media">
                            <i class="material-icons">radio_button_unchecked</i>
                        </div>
                        <div class="item-inner">
                            <div class="item-title">
                                <div class="item-header">Khóa học</div>
                                ${courseName}
                                <div class="item-footer">${courseInfo}</div>
                            </div>
                        </div>
                    </a>
                </li>`);
            });
        });
    }

    loadCourseGrade(url) {
        return new Promise(resolve => {
            this.core.sendGet(this.FAP_URL + '/Grade/StudentGrade.aspx' + url).then(StudentPageHTML => {
                let doc = this.parser.parseFromString(StudentPageHTML, 'text/html');
                let table = doc.querySelector('#ctl00_mainContent_divGrade table');
                table.querySelector('caption').innerHTML = '';
                resolve(table.innerHTML);
            });
        });
    }

    getStudentInfo() {
        let userDetail = {};
        return new Promise((resolve, reject) => {
            this.core.sendGet('http://fap.greenwich.edu.vn/User/UserDetail.aspx', {}).then(userDetailHTML => {
                let doc = this.parser.parseFromString(userDetailHTML, 'text/html');
                doc.querySelector('form[name="aspnetForm"]').querySelector("table").querySelector("table table tbody").querySelectorAll("tr").forEach(row => {
                    let colName = row.querySelectorAll("td")[0].innerText;
                    if (colName === 'Email') {
                        userDetail['email'] = row.querySelectorAll("td")[1].innerText;
                    } else if (colName === 'Full name') {
                        userDetail['name'] = row.querySelectorAll("td")[1].innerText.replace(' ', ' ');
                    } else if (colName === 'Login') {
                        userDetail['student_code'] = row.querySelectorAll("td")[1].innerText.toUpperCase();
                    } else if (colName === 'Image') {
                        userDetail['avatar'] = this.FAP_URL + row.querySelector("img").getAttribute('src').replace('..', '');
                    }
                });
                if (typeof userDetail['avatar'] !== 'undefined' && userDetail.avatar !== '') {
                    this.core.sendGet(userDetail.avatar, {}).then(avatarRaw => {
                        userDetail['avatar'] = btoa(avatarRaw);
                        resolve(userDetail);
                    });
                } else {
                    resolve(userDetail);
                }
            });
        });
    }

    getWeekClasses(selectedWeek = '') {
        let weeklyTimeTable = [];
        let weeksList = [];
        return new Promise((resolve, reject) => {
            let request;
            if (selectedWeek !== '') {
                request = this.core.sendPost('http://fap.greenwich.edu.vn/Report/ScheduleOfWeek.aspx', {
                    ctl00$mainContent$drpSelectWeek: selectedWeek,
                    __EVENTARGUMENT: this.__EVENTARGUMENT,
                    __LASTFOCUS: this.__LASTFOCUS,
                    __VIEWSTATE: this.__VIEWSTATE,
                    __EVENTVALIDATION: this.__EVENTVALIDATION
                });
            } else {
                request = this.core.sendGet('http://fap.greenwich.edu.vn/Report/ScheduleOfWeek.aspx', {});
            }
            request.then(htmlData => {
                // console.log(htmlData);
                let date = new Date();
                let doc = this.parser.parseFromString(htmlData, 'text/html');
                doc.querySelector('table').querySelector('table')
                    .querySelector('tbody').querySelectorAll('tr').forEach((slots, slotIndex) => {
                    slots.querySelectorAll('td').forEach((day, dayIndex) => {
                        if (!weeklyTimeTable[dayIndex - 1]) weeklyTimeTable[dayIndex - 1] = [];
                        if (day.innerText.trim() !== "-" && dayIndex !== 0) {
                            let slotName = day.querySelectorAll('a')[0];
                            let slotAttendDetail = day.querySelectorAll('a')[1];
                            let className = slotName.innerHTML.split('<br>')[0];
                            let classLocation = slotName.innerHTML.split('<br>')[1].replace(' at ', '');
                            let attendStatus = slotAttendDetail.querySelector('font').innerText;
                            let slotTime = slotAttendDetail.querySelector('span') ? slotAttendDetail.querySelector('span').innerText : '';
                            weeklyTimeTable[dayIndex - 1].push({
                                className: className,
                                classLocation: classLocation,
                                attendStatus: attendStatus,
                                slotTime: slotTime
                            });
                        }
                    });
                });
                doc.querySelector('#ctl00_mainContent_drpSelectWeek').querySelectorAll('option').forEach(opt => {
                    // console.log(opt.value, opt.innerText, opt.getAttribute('selected') === 'selected')
                    weeksList.push({
                        text: opt.innerText.toLowerCase().replace(' to ', ' - '),
                        value: opt.value,
                        selected: opt.getAttribute('selected') === 'selected'
                    });
                });
                this.__EVENTARGUMENT = doc.querySelector('#__EVENTARGUMENT') ? doc.querySelector('#__EVENTARGUMENT').value : "";
                this.__LASTFOCUS = doc.querySelector('#__LASTFOCUS') ? doc.querySelector('#__LASTFOCUS').value : "";
                this.__VIEWSTATE = doc.querySelector('#__VIEWSTATE') ? doc.querySelector('#__VIEWSTATE').value : "";
                this.__EVENTVALIDATION = doc.querySelector('#__EVENTVALIDATION') ? doc.querySelector('#__EVENTVALIDATION').value : "";
                resolve({
                    weeks: weeksList,
                    timeTable: weeklyTimeTable
                });
            });
        });
    }

    getNews() {
        return new Promise((resolve, reject) => {
            let listNews = [];
            this.core.sendGet('http://fap.greenwich.edu.vn/CmsFAP/PlusNews.aspx').then(portalHTML => {
                let doc = this.parser.parseFromString(portalHTML, 'text/html');
                doc.querySelector('#ctl00_mainContent_divContent').querySelectorAll('li a').forEach(news => {
                    listNews.push({
                        time: news.innerHTML.split(' • ')[0],
                        title: news.innerHTML.split(' • ')[1],
                        link: news.getAttribute('href')
                    });
                });
                resolve(listNews);
            });
        });
    }
    loadStudentGradeCourses(url = '') {
        if (url === '') {
            url = this.FAP_URL + '/Grade/StudentGrade.aspx';
        } else {
            url = this.FAP_URL + '/Grade/StudentGrade.aspx' + url;
        }
        return new Promise(resolve => {
            this.core.sendGet(url, {}).then(pageHTML => {
                let doc = this.parser.parseFromString(pageHTML, 'text/html');
                let terms = [];
                let courses = [];
                doc.querySelectorAll("#ctl00_mainContent_divTerm td").forEach(termDiv => {
                    let termSelected = false;
                    let termLink = termDiv.querySelectorAll("a");
                    if (termLink.length === 0) termSelected = true;
                    terms.push({
                        link: (!termSelected) ? termLink[0].getAttribute('href') : '',
                        selected: termSelected ? 'yes' : 'no',
                        name: termDiv.innerText
                    });
                });
                doc.querySelectorAll('#ctl00_mainContent_divCourse td').forEach(coursesDiv => {
                    let courseLink = coursesDiv.querySelector('a').getAttribute('href');
                    let courseText = coursesDiv.innerText;
                    courses.push({
                        name: courseText,
                        link: courseLink
                    })
                });
                resolve({
                    terms: terms,
                    courses: courses
                });
            });
        });
    }

    loadNewsDetail(url) {
        return new Promise(resolve => {
            this.core.sendGet(this.FAP_URL + '/CmsFAP/' + url).then(newsHTML => {
                let doc = this.parser.parseFromString(newsHTML, 'text/html');
                let html = doc.querySelector('#ctl00_mainContent_divContent').innerHTML;
                resolve(html);
            });
        });
    }

    selectCampus(id) {
        return new Promise(resolve => {
            this.browser.executeScript({
                code: `$('#ctl00_mainContent_ddlCampus').val(${id}); __doPostBack('ctl00$mainContent$ddlCampus','');`
            }, () => {
                let waitingSelectingCampus = true;
                this.browser.addEventListener("loadstop", e => {
                    setTimeout(() => {
                        if (waitingSelectingCampus) resolve(e.url);
                    }, 1000);
                });
            });
        });
    }
    login() {
        return new Promise(resolve => {
            this.browser.show();
            let loginURL = `https://accounts.google.com/o/oauth2/v2/auth?scope=https%3A//www.googleapis.com/auth/userinfo.email&access_type=offline&response_type=id_token&nonce=none&redirect_uri=http://fap.greenwich.edu.vn/Default.aspx&client_id=1096859633289-ts7fjh1bf832iblsrv4qnct28vuddagv.apps.googleusercontent.com`;
            this.browser.executeScript({
                code: `location.href='${loginURL}';`
            }, () => {
                let isWaitingLogin = true;
                let isLoggedInGoogle = false;
                this.browser.addEventListener("loadstop", e => {
                    if (isWaitingLogin && e.url.includes('#id_token')) {
                        isWaitingLogin = false;
                        isLoggedInGoogle = true;
                        this.browser.hide();

                        let newURL = e.url.replace('#id_token', '?token');
                        this.browser.executeScript({
                            code: `location.href='${newURL}'`
                        }, () => {
                            let isWaitingFinish = true;
                            this.browser.addEventListener("loadstop", e => {
                                if (isWaitingFinish && e.url.includes("Student.aspx")) {
                                    resolve();
                                }
                            });
                        });
                    } else if (isWaitingLogin && !isLoggedInGoogle) {
                        this.browser.show();
                    }
                });
            });
        });
    }

    getCookies() {
        return new Promise(resolve => {
            let cookiesToGet = ['G_ENABLED_IDPS', 'ASP.NET_SessionId', 'G_AUTHUSER_H'];
            let promises = [];
            let cookieString = "";
            cookiesToGet.forEach(cName => {
                promises.push(new Promise(ok => {
                    cookieMaster.getCookieValue("http://fap.greenwich.edu.vn", cName, c => {
                        cookieString += cName + "=" + c.cookieValue + ";";
                        ok();
                    }, f => {ok()});
                }));
            });

            Promise.all(promises).then(data => {
                this.cookieString = cookieString;
                resolve(cookieString);
            });
        });
    }

}
