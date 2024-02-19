define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider", "ojs/ojmodulerouter-adapter", 
    "ojs/ojcorerouter", "ojs/ojurlparamadapter",  "ojs/ojinputsearch"], 
    function (oj,ko,$, app, ArrayDataProvider, ModuleRouterAdapter, CoreRouter, UrlParamAdapter) {

        class Help {
            constructor(args) {
                var self = this;

                self.connected = function () {
                    if (sessionStorage.getItem("userName") == null) {
                        self.router.go({path : 'signin'});                        
                    }
                    else {
                        app.onAppSuccess();
                    }
                }
                self.role = ko.observable(sessionStorage.getItem("userRole"));
                
                self.value = ko.observable();
                self.suggestions = [
                    { value: "IE", label: "Internet Explorer" },
                    { value: "FF", label: "Firefox" },
                    { value: "CH", label: "Chrome" },
                    { value: "OP", label: "Opera" },
                    { value: "SA", label: "Safari" },
                ];
                self.suggestionsDP = new ArrayDataProvider(self.suggestions, {
                    keyAttributes: "value",
                });

                self.goToPage = (e)=>{
                    const page = e.currentTarget.id
                    window.location.href = `/?ojr=${page}`;
                }
               
            }
        }
        return  Help;
    }
);