define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider", "ojs/ojconverterutils-i18n",
    "ojs/ojlistdataproviderview","ojs/ojdataprovider", "ojs/ojpagingdataproviderview",
    "ojs/ojdatetimepicker", "ojs/ojlabel", "ojs/ojselectsingle", "ojs/ojradioset", "ojs/ojdialog",
    "ojs/ojselectcombobox", "ojs/ojtable", "ojs/ojpopup", "ojs/ojprogress-circle", "ojs/ojpagingcontrol", "ojs/ojmenu"], 
    function (oj,ko,$, app, ArrayDataProvider, ojconverterutils_i18n_1, ListDataProviderView, ojdataprovider_1, PagingDataProviderView) {

        class MissedReminder {
            constructor(args) {
                var self = this;
                
                self.router = args.parentRouter;
                let BaseURL = sessionStorage.getItem("BaseURL")
                
                self.officeId = ko.observable();
                self.userRole = ko.observable(sessionStorage.getItem("userRole"));

                const currentDate = new Date();
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const day = currentDate.getDate();

                self.fromDate = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year, month, day)));
                self.datePicker = {
                    numberOfMonths: 1
                };
                self.toDate = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year, month,day)));

                self.selectOffice = ko.observable();

                self.offices = [];

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
                                self.offices.push({value: `All`, label: `All`})
                                for(let i=0;i<len;i++){
                                    self.offices.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                }
                                if(self.userRole()=="admin" || self.userRole()=="director"){
                                    self.officeId(["All"])
                                }
                                else{
                                    self.officeId([sessionStorage.getItem("userOfficeId")]);
                                }
                            }
                        }
                    })
                }
                self.officesDP = new ArrayDataProvider(self.offices, {
                    keyAttributes: 'value'
                });
                self.getOffices()

                self.studyAbroadDestination = ko.observable(["All"]);

                self.abroadDestionations = [
                    {"label":"All","value":"All"},
                    {"label":"UK","value":"UK"},
                    {"label":"Canada","value":"Canada"},
                    {"label":"USA","value":"USA"},
                    {"label":"Australia","value":"Australia"}
                ]

                self.abroadDestionationsDp = new ArrayDataProvider(self.abroadDestionations, {
                    keyAttributes: 'value'
                });
                
                self.blob = ko.observable();
                self.fileName = ko.observable();
                self.recordsCount = ko.observable(0);

                self.viewProfile = (e)=>{
                    // window.location.href = `/?ojr=studentProfile&id=${e.currentTarget.id}`;
                    window.open(`/?ojr=studentProfile&id=${e.currentTarget.id}`, "_blank");
                }

                self.missedReminder = ko.observableArray()
                self.missedReminderDp = new ArrayDataProvider(self.missedReminder, {
                    keyAttributes: "staffId",
                });

                self.showData = ()=>{
                    let fromDate = self.fromDate()
                    let toDate = self.toDate();
                    let office = self.officeId();
                    office = office.join(",");
                    let countryOfIntrest = self.studyAbroadDestination();
                    countryOfIntrest = countryOfIntrest.join(",");
                    if(office!="" && countryOfIntrest!=""){
                        let popup = document.getElementById("progressBar");
                        popup.open();
                        self.missedReminder([]);
                        $.ajax({
                            url: BaseURL+"/getMissedReminderReport",
                            type: 'POST',
                            data: JSON.stringify({
                                fromDate: fromDate,
                                toDate: toDate,
                                officeId: office,
                                countryOfIntrest: countryOfIntrest,
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                if(data[0]!='No data found'){
                                    data = JSON.parse(data);
                                    let len = data.length;
                                    var csvContent = '';
                                    var headers = ['Staff Name', 'Count'];
                                    csvContent += headers.join(',') + '\n';
                                    self.recordsCount(len)
                                    for(let i=0;i<len;i++){
                                        self.missedReminder.push({
                                            "counsilorId": data[i][0],
                                            "userName": data[i][1],
                                            "count": data[i][2],
                                        })

                                        var rowData = [data[i][1], data[i][2]]; 
                                        csvContent += rowData.join(',') + '\n';
                                    }
                                    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    var today = new Date();
                                    var fileName = 'Missed_Reminder_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                    self.blob(blob);
                                    self.fileName(fileName);
                                }
                                else{
                                    self.recordsCount(0)
                                    var csvContent = '';
                                    var headers = ['Staff Name', 'Count'];
                                    csvContent += headers.join(',') + '\n';
                                    var rowData = []; 
                                    csvContent += rowData.join(',') + '\n';
                                    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    var today = new Date();
                                    var fileName = 'Missed_Reminder_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                    self.blob(blob);
                                    self.fileName(fileName);
                                }
                                let popup = document.getElementById("progressBar");
                                popup.close();
                            }
                        })
                    }
                }

                self.filter = ko.observable('');

                self.userMissedReminder = ko.observableArray()
                       
                self.comparator = (a, b) => {
                    if (a === b) {
                        return 0;
                    }
                    const dateA = new Date(a).getTime();
                    const dateB = new Date(b).getTime();
                    return dateA < dateB ? -1 : 1;
                };

                self.userMissedReminderDp = ko.computed(function () {
                    let filterCriterion = null;
                    if (self.filter() && self.filter() != '') {
                        filterCriterion = ojdataprovider_1.FilterFactory.getFilter({
                            filterDef: { text: self.filter() }
                        });
                    }
                    const arrayDataProvider = new ArrayDataProvider(self.userMissedReminder(), { 
                        keyAttributes: 'studentId',
                        sortComparators: {
                            comparators: new Map().set("reminderDate", self.comparator),
                        },
                    });
                    
                    return new ListDataProviderView(arrayDataProvider, { filterCriterion: filterCriterion });
                }, self);

                self.handleValueChanged = () => {
                    self.filter(document.getElementById('filter').rawValue);
                };

                self.userBlob = ko.observable();
                self.userFileName = ko.observable();

                self.viewFullReport = (e) => {
                    let popup = document.getElementById("progressBar");
                    popup.open();
                    self.userMissedReminder([])
                    let userId = e.currentTarget.id;
                    let fromDate = self.fromDate()
                    let toDate = self.toDate();
                    let office = self.officeId();
                    office = office.join(",");
                    let countryOfIntrest = self.studyAbroadDestination();
                    countryOfIntrest = countryOfIntrest.join(",");
                    $.ajax({
                        url: BaseURL+"/getUserMissedReport",
                        type: 'POST',
                        data: JSON.stringify({
                            fromDate: fromDate,
                            toDate: toDate,
                            officeId: office,
                            countryOfIntrest: countryOfIntrest,
                            userId: userId,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0]!='No data found'){
                                data = JSON.parse(data);
                                let len = data.length;
                                var csvContent = '';
                                var headers = ['Student Id', 'Student Name', 'Note Status', 'Reminder Date', 'Notes', 'Status', 'Sub Status'];
                                csvContent += headers.join(',') + '\n';
                                for(let i=0;i<len;i++){
                                    self.userMissedReminder.push({
                                        "studentId": data[i][0],
                                        "studentName": `${data[i][1]} ${data[i][2]}`,
                                        "noteStatus": "Missed",
                                        "reminderDate": data[i][4],
                                        "notes": data[i][5],
                                        "status": data[i][6]
                                    })
                                    var rowData = [data[i][0], `${data[i][1]} ${data[i][2]}`, "Missed", data[i][4], data[i][5], data[i][6], data[i][7]]; 
                                    csvContent += rowData.join(',') + '\n';
                                }
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'User_Reminder_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.userBlob(blob);
                                self.userFileName(fileName);
                                let popup = document.getElementById("progressBar");
                                popup.close();
                                let popup1 = document.getElementById("userReminderReport");
                                popup1.open();
                            }
                            else{
                                self.recordsCount(0)
                                var csvContent = '';
                                var headers = ['Student Id', 'Student Name', 'Note Status', 'Reminder Date', 'Notes', 'Status', 'Sub Status'];
                                csvContent += headers.join(',') + '\n';
                                var rowData = []; 
                                csvContent += rowData.join(',') + '\n';
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'User_Reminder_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.userBlob(blob);
                                self.userFileName(fileName);
                                let popup = document.getElementById("progressBar");
                                popup.close();
                            }
                        }  
                    })
                }    

                self.closePopup = ()=>{
                    let popup = document.getElementById("userReminderReport");
                    popup.close();
                }

                self.downloadData = ()=>{
                    if(self.blob() != undefined && self.fileName() != undefined){
                        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                            // For Internet Explorer
                            window.navigator.msSaveOrOpenBlob(self.blob(), self.fileName());
                        } else {
                            // For modern browsers
                            var link = document.createElement('a');
                            link.href = window.URL.createObjectURL(self.blob());
                            link.download = self.fileName();
                            link.style.display = 'none';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    }
                }                

                self.userReportDownload = ()=>{
                    if(self.userBlob() != undefined && self.userFileName() != undefined){
                        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                            // For Internet Explorer
                            window.navigator.msSaveOrOpenBlob(self.userBlob(), self.userFileName());
                        } else {
                            // For modern browsers
                            var link = document.createElement('a');
                            link.href = window.URL.createObjectURL(self.userBlob());
                            link.download = self.userFileName();
                            link.style.display = 'none';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    }
                }

                self.stIdRightClick = ko.observable();
                self.myActionFunction = (event) => {
                    let menu = event.detail.selectedValue;
                    if(menu=="openNewTab"){
                        if(self.stIdRightClick()!=undefined){
                            window.open(`/?ojr=studentProfile&id=${self.stIdRightClick()}`, "_blank");
                        }
                    }
                };

                self.myBeforeOpenFunction = (event) => {
                    const target = event.detail.originalEvent.target;
                    const context = document.getElementById("table").getContextByNode(target);
                    self.stIdRightClick(context.key);
                };

                self.connected = function () {
                    if (sessionStorage.getItem("userName") == null) {
                        self.router.go({path : 'signin'});
                    }
                    else {
                        app.onAppSuccess();
                    }
                }

            }
        }
        return  MissedReminder;
    }
);