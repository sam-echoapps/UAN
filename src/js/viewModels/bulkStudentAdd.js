define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider", "ojs/ojfilepickerutils",
     "ojs/ojfilepicker", "ojs/ojpopup", "ojs/ojprogress-circle", "ojs/ojselectsingle", "ojs/ojdialog"], 
    function (oj,ko,$, app, ArrayDataProvider, FilePickerUtils) {

        class AddBulkStudent {
            constructor(args) {
                var self = this;

                self.router = args.parentRouter;
                let BaseURL = sessionStorage.getItem("BaseURL")
                self.connected = function () {
                    if (sessionStorage.getItem("userName") == null) {
                        self.router.go({path : 'signin'});
                    }
                    else {
                        app.onAppSuccess();
                    }
                }
                
                self.userRole = ko.observable(sessionStorage.getItem("userRole"));
                
                self.office = ko.observable();
                self.officeError = ko.observable();
                self.offices = ko.observable([]);
                self.getOffices = ()=>{
                    $.ajax({
                        url: BaseURL+"/getOffices",
                        type: 'GET',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                for(let i=0;i<len;i++){
                                    self.offices().push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                }
                            }
                        }
                    })
                }
                self.getOffices();
                self.officesList = new ArrayDataProvider(self.offices(), {
                    keyAttributes: 'value'
                });

                self.officeActionHandler = (e)=>{
                    let officeId = e.detail.value;
                    self.officeError("")
                    self.counsilor("")
                    document.getElementById("selectCounsilor").style.display = "block";
                    self.getCounselors(officeId)
                }

                self.counsilor = ko.observable();
                self.counsilorError = ko.observable();
                self.counselors = ko.observableArray([])

                self.getCounselors = (officeId)=>{
                    self.counselors([])
                    $.ajax({
                        url: BaseURL+"/getCounselors",
                        type: 'POST',
                        data: JSON.stringify({
                            office: officeId,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                for(let i=0;i<len;i++){
                                    self.counselors.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                }
                            }
                        }
                    })
                }
                self.counselorList = new ArrayDataProvider(self.counselors, {
                    keyAttributes: 'value'
                });

                self.counsilorActionHandler = ()=>{
                    self.counsilorError("")
                }

                self.fileName = ko.observable();
                self.files = ko.observable();
                self.selectListener = (event) => {
                    const files = event.detail.files;
                    self.files(files);
                    self.fileError("")
                    self.fileName(
                        Array.prototype.map.call(files, function (file) {
                            return file.name;
                        })
                    );
                };

                self.fileError = ko.observable();
                self.successMessage = ko.observable();

                if(self.userRole()=="counselor"){
                    self.office(sessionStorage.getItem("userOfficeId"));
                    self.counsilor(sessionStorage.getItem("userId"));
                }

                if(self.userRole()=="manager"){
                    self.office(sessionStorage.getItem("userOfficeId"));
                    self.getCounselors(sessionStorage.getItem("userOfficeId"))
                }

                self.fileUpload = ()=>{
                    const files = self.files();
                    if(self.office()==undefined || self.office()==""){
                        self.officeError("Please select a office")
                    }
                    else if(self.counsilor()==undefined || self.office()==""){
                        self.counsilorError("Please select a counsilor")
                    }
                    else if(files==undefined){
                        self.fileError("please select a file")
                    }
                    else{
                        self.officeError("")
                        self.counsilorError("")
                        self.fileError("")
                        let popup = document.getElementById("popup1");
                        popup.open();
                        self.fileName(
                            Array.prototype.map.call(files, function (file) {
                                var formData = new FormData();
                                const officeId = self.office();
                                const counsilorId = self.counsilor();
                                const addUserId = sessionStorage.getItem("userId");
                                formData.append("officeId", officeId);
                                formData.append("counsilorId", counsilorId);
                                formData.append("addUserId", addUserId);
                                formData.append("file", file);
                                $.ajax({
                                    url:   BaseURL + "/bulkStudentAdd",
                                    type: "POST",
                                    data: formData,
                                    cache: false,
                                    contentType: false,
                                    processData: false,
                                    error: function (jqXHR, textStatus, errorThrown) {
                                        console.log(textStatus);
                                    },
                                    success: (data) => {
                                        let popup = document.getElementById("popup1");
                                        popup.close();
                                        self.successMessage(data[0]);
                                        popup = document.getElementById("successMessage");
                                        popup.open();
                                    }
                                });
                                return file.name;
                            })
                        );
                    }
                }
                
                self.messageClose = ()=>{
                    location.reload();
                }

                self.cancelListener = ()=> {
                    let popup = document.getElementById("popup1");
                    popup.close();
                }
            }
        }
        return  AddBulkStudent;
    }
);