class NorthStudio {
    constructor(platform = "browser") {
        // platform list: cordova / chrome
        this.platform = platform;
        this.cookieString = "";
    }

    getData(key, defaultValue) {
        return new Promise(resolve => {
            if (this.platform === 'chrome') {
                chrome.storage.local.get([key], resolve, err => {
                    resolve(defaultValue);
                });
            } else {
                NativeStorage.getItem(key, resolve, err => {
                    resolve(defaultValue);
                });
            }
        });
    }

    setData(key, value) {
        return new Promise(resolve => {
            if (this.platform === 'chrome') {
                let dataToSet = {};
                dataToSet[key] = value;
                chrome.storage.local.set(dataToSet, resolve);
            } else {
                NativeStorage.setItem(key, value, resolve, console.error);
            }
        });
    }

    getCookies() {
        return new Promise(resolve => {
            if (this.platform === 'chrome') {
                let cookieString = "";
                chrome.cookies.getAll({
                    url: "https://www.facebook.com"
                }, cookies => {
                    // this.cookies = cookies;
                    cookies.forEach(c => {
                        cookieString += c.name + "=" + c.value + ";";
                    });
                    // this.cookieString = cookieString;
                    resolve(cookieString);
                });
            } else {
                let cookiesName = ['sb', 'datr', 'c_user', 'xs', 'wd', 'spin', 'fr', 'presence', 'act'];
                let promises = [];
                let cookieString = "";
                cookiesName.forEach((cookieName) => {
                    promises.push(new Promise(backward => {
                        cookieMaster.getCookieValue('https://m.facebook.com', cookieName, cookie => {
                            cookieString += cookieName + "=" + cookie.cookieValue;
                            backward();
                        }, err => {
                            backward();
                        })
                    }));
                });
                Promise.all(promises).then(() => {
                    resolve(cookieString);
                });
            }
        });
    }

    // on chrome, background will be seperated into a new task, otherwise, we will run it directly in the background of the UI

    sendGet(url, data) {
        return new Promise((resolve, reject) => {
            if (this.platform === "chrome") {
                $.get(url, data).then(resolve).fail(reject);
            } else {
                cordova.plugin.http.sendRequest(url, {
                    method: "get",
                    data: data,
                    headers: {cookie: this.cookieString}
                }, response => {
                    resolve(response.data);
                }, reject);
            }
        });
    }

    sendPost(url, data) {
        return new Promise((resolve, reject) => {
            if (this.platform === "chrome") {
                $.post(url, data).then(resolve).fail(reject);
            } else {
                cordova.plugin.http.sendRequest(url, {
                    method: "post",
                    data: data,
                    headers: {cookie: this.cookieString}
                }, response => {
                    resolve(response.data);
                }, reject);
            }
        });
    }

    isBase64(str) {
        if (str === '' || str.trim() === '') {
            return false;
        }
        try {
            return btoa(atob(str)) == str;
        } catch (err) {
            return false;
        }
    }

    getDateOfISOWeek(w, y) {
        var simple = new Date(y, 0, 1 + (w - 1) * 7);
        var dow = simple.getDay();
        var ISOweekStart = simple;
        if (dow <= 4)
            ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        else
            ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        return ISOweekStart;
    }

    customBase64Encode(inputStr) {
        let bbLen = 3,
            enCharLen = 4,
            inpLen = inputStr.length,
            inx = 0,
            jnx,
            keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
                + "0123456789+/=",
            output = "",
            paddingBytes = 0;
        let byteBuffer = new Array(bbLen),
            encodedCharIndexes = new Array(enCharLen);

        while (inx < inpLen) {
            for (jnx = 0; jnx < bbLen; ++jnx) {
                if (inx < inpLen)
                    byteBuffer[jnx] = inputStr.charCodeAt(inx++) & 0xff;
                else
                    byteBuffer[jnx] = 0;
            }
            encodedCharIndexes[0] = byteBuffer[0] >> 2;
            encodedCharIndexes[1] = ((byteBuffer[0] & 0x3) << 4) | (byteBuffer[1] >> 4);
            encodedCharIndexes[2] = ((byteBuffer[1] & 0x0f) << 2) | (byteBuffer[2] >> 6);
            encodedCharIndexes[3] = byteBuffer[2] & 0x3f;

            //--- Determine whether padding happened, and adjust accordingly.
            paddingBytes = inx - (inpLen - 1);
            switch (paddingBytes) {
                case 1:
                    // Set last character to padding char
                    encodedCharIndexes[3] = 64;
                    break;
                case 2:
                    // Set last 2 characters to padding char
                    encodedCharIndexes[3] = 64;
                    encodedCharIndexes[2] = 64;
                    break;
                default:
                    break; // No padding - proceed
            }
            for (jnx = 0; jnx < enCharLen; ++jnx)
                output += keyStr.charAt(encodedCharIndexes[jnx]);
        }
        return output;
    }


}
