define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojinputtext", "ojs/ojformlayout", 
    "ojs/ojvalidationgroup", "ojs/ojpopup", "ojs/ojprogress-circle", "ojs/ojdialog"], 
    function (oj,ko,$, app) {

        class SignIn {
            constructor() {
                var self = this;

                self.username = ko.observable();
                self.password = ko.observable();
                self.formValid = ko.observable();
                self.SignIn = ko.observable();
                
                self.logout = ()=>{
                    sessionStorage.clear();
                }
                self.logout()

                self.signIn = ()=>{
                    const formValid = self._checkValidationGroup("formValidation"); 
                    if (formValid) {
                        let popup = document.getElementById("popup1");
                        popup.open();
                        $.ajax({
                            url: "http://169.197.183.168:9000/uanLogin",
                            type: 'POST',
                            data: JSON.stringify({
                                user: self.username(),
                                passwd : self.password()
                            }),
                            dataType: 'json',
                            timeout: sessionStorage.getItem("timeInetrval"),
                            context: self,
                            error: function (xhr, textStatus, errorThrown) {
                                let popup = document.getElementById("popup1");
                                popup.close();
                                self.username('')
                                self.password('')
                                let popup1 = document.getElementById("errorLog");
                                popup1.open();
                            },
                            success: function (data) {
                                if (data[1]== 'Y') {
                                    sessionStorage.setItem("userId", data[2]);
                                    sessionStorage.setItem("userName", data[5]);
                                    sessionStorage.setItem("userRole", data[4]);
                                    sessionStorage.setItem("userOfficeId", data[6]);
                                    sessionStorage.setItem("userPartnerId", data[7]);
                                    sessionStorage.setItem("BaseURL", "http://169.197.183.168:9000/");
                                    self.SignIn('Y');
                                    app.onLoginSuccess();
                                }
                                if(data[1]=='N'){
                                    let popup1 = document.getElementById("popup1");
                                    popup1.close();
                                    self.username('')
                                    self.password('')
                                    let popup = document.getElementById("errorLog");
                                    popup.open();
                                }
                            }
                        })
                    }
                }

                self.LoginMsgOKClose = ()=>{
                    let popup = document.getElementById("errorLog");
                    popup.close();
                }

                self._checkValidationGroup = (value) => {
                    const tracker = document.getElementById(value);
                    if (tracker.valid === "valid") {
                        return true;
                    }
                    else {
                        tracker.showMessages();
                        tracker.focusOn("@firstInvalidShown");
                        return false;
                    }
                };
            }
        }
        return  SignIn;
    }
);