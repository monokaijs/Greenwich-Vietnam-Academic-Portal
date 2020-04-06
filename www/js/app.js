const $$ = Dom7;
const platform = cordova.platformId === "browser" ? "chrome" : "cordova";
var system, fap, backgroundTask;

const app = new Framework7({
    id: 'com.nstudio.mtoolkit',
    root: '#app',
    theme: "md",
    routes: routes
});
app.popup.open('.login-screen', false);


const homeView = app.views.create(".view-home", {
    url: "/home/"
});
const gradeView = app.views.create(".view-grade", {
    url: "/grade/"
});
const settingsView = app.views.create('.view-settings', {
    url: '/settings/'
});

const notifications = app.views.create('.view-notifications', {
    url: '/notifications/'
});


document.addEventListener("deviceready", () => {
    system = new NorthStudio(platform);
    fap = new FAP(system);
}, false);


$$(document).on('page:init', e => {
});

$(document).on('click', '.item-news', function () {
    let newsURL = $(this).data('news');
    app.preloader.show();
    fap.loadNewsDetail(newsURL).then(newsHTML => {
        app.preloader.hide();
        let dynamicPopup = app.popup.create({
            content: `<div class="popup" style="color: black;">
              <div class="navbar">
                <div class="navbar-bg"></div>
                <div class="navbar-inner">
                  <div class="right">
                    <a class="link popup-close">Đóng</a>
                  </div>
                </div>
              </div>
              <div class="page" style="background-color: white;">
                <div class="page-content" style="background-color: white;">
                    <div class="block">
                        ${newsHTML}
                    </div>
                </div>
              </div>
            </div>`
        }).open();
    });
});

$(document).on('click', '.logout', function (e) {
    app.dialog.confirm('Bạn có chắc muốn đăng xuất?', 'Academic Portal', () => {
        cookieMaster.clearCookies();
        location.reload();
    });
});
$(document).on('click', '.load-term', function (e) {
    let selected = $(this).data('selected');
    let link = $(this).data('link');
    if (selected === 'no') {
        app.preloader.show();
        fap.renderTermCourses(link);
    }
});
$(document).on('click', '.load-course', function (e) {
    $('.course-grade-block').hide();
    let link = $(this).data('link');
    app.preloader.show();
    fap.loadCourseGrade(link).then(tableHTML => {
        app.preloader.hide();
        $('.course-grade-block').show();
        $('.course-grade').html(tableHTML);
    });
});

$(document).on('click', '.select-week', function () {
    $('.select-week').removeClass('selected');
    $(this).addClass('selected');
    let weekId = $(this).data('week');
    app.preloader.show();
    fap.renderTimeTable(weekId).then(() => {
        console.log('loaded');
    });
});

$(document).on('click', '.reload-schedule', function () {
    fap.renderTimeTable();
});

let isDarkMode = localStorage.getItem('isDarkMode') === "true";
if (isDarkMode) $("#app").addClass('theme-dark');
let themeColor = localStorage.getItem('themeColor') || "blue";
$("#app").addClass('color-theme-' + themeColor);
$(document).on('click', '.choose-theme-color', function () {
    $("#app").removeClass('color-theme-' + themeColor);
    themeColor = $(this).data('color');
    $("#app").addClass('color-theme-' + themeColor);
    localStorage.setItem('themeColor', themeColor);
});
$('.toggle-dark-mode').on('click', e => {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
        $("#app").addClass('theme-dark');
        localStorage.setItem('isDarkMode', 'true');
    } else {
        $("#app").removeClass('theme-dark');
        localStorage.setItem('isDarkMode', 'false');
    }
});
