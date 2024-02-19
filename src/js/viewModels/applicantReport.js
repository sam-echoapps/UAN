define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider", "ojs/ojconverterutils-i18n",
    "ojs/ojlistdataproviderview","ojs/ojdataprovider", "ojs/ojpagingdataproviderview",
    "ojs/ojdatetimepicker", "ojs/ojlabel", "ojs/ojselectsingle", "ojs/ojradioset", "ojs/ojdialog",
    "ojs/ojselectcombobox", "ojs/ojtable", "ojs/ojpopup", "ojs/ojprogress-circle", "ojs/ojpagingcontrol", "ojs/ojmenu"], 
    function (oj,ko,$, app, ArrayDataProvider, ojconverterutils_i18n_1, ListDataProviderView, ojdataprovider_1, PagingDataProviderView) {

        class ApplicantReport {
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
                                    self.officeId(sessionStorage.getItem(["userOfficeId"]));
                                    self.getCounsilors(self.officeId())
                                }
                            }
                        }
                    })
                }
                self.officesDP = new ArrayDataProvider(self.offices, {
                    keyAttributes: 'value'
                });
                self.getOffices()

                self.officeChangedHandler = (event) => {
                    let offices = event.detail["value"];
                    offices = offices.join(",");
                    self.getCounsilors(offices);
                };

                self.selectStaff = ko.observable();
                self.staffs = ko.observableArray();
                self.getCounsilors = (officeId)=>{
                    self.staffs([])
                    $.ajax({
                        url: BaseURL+"/getOfficesCounsilors",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: officeId,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0]!="No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.staffs.push({value: `All`, label: `All`})
                                for(let i=0;i<len;i++){
                                    self.staffs.push({value: `${data[i][0]}`, label: `${data[i][3]}`})
                                }
                            }
                            else{
                                self.staffs.push({value: `All`, label: `All`})
                            }
                        }
                    })
                }
                self.staffsDP = new ArrayDataProvider(self.staffs, {
                    keyAttributes: 'value'
                });
                
                self.blob = ko.observable();
                self.fileName = ko.observable();
                self.recordsCount = ko.observable(0);

                self.viewProfile = (e)=>{
                    // window.location.href = `/?ojr=studentProfile&id=${e.currentTarget.id}`;
                    window.open(`/?ojr=studentProfile&id=${e.currentTarget.id}`, "_blank");
                }

                self.comparator = (a, b) => {
                    if (a === b) {
                        return 0;
                    }
                    const dateA = new Date(a).getTime();
                    const dateB = new Date(b).getTime();
                    return dateA < dateB ? -1 : 1;
                };

                self.applicantReport = ko.observableArray()

                self.showData = ()=>{
                    document.getElementById("report-table").style.display = "block"
                    let fromDate = self.fromDate()
                    let toDate = self.toDate();
                    let office = self.officeId();
                    if(self.userRole() == "admin" || self.userRole() == "director"){
                        office = office.join(",");
                    }
                    let staff = self.selectStaff();
                    staff = staff.join(",");
                    let popup = document.getElementById("progressBar");
                    popup.open();
                    self.applicantReport([])
                    $.ajax({
                        url: BaseURL+"/getApplicantReport",
                        type: 'POST',
                        data: JSON.stringify({
                            fromDate: fromDate,
                            toDate: toDate,
                            officeId: office,
                            staffId: staff,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0]!='No data found'){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.recordsCount(len);
                                var csvContent = '';
                                var headers = ['Staff Name', 'Number Of Students', 'Office Name'];
                                csvContent += headers.join(',') + '\n';
                                for(var i=0;i<len;i++){
                                    self.applicantReport.push({
                                        staff:data[i][0],
                                        noOfStudents:data[i][1],
                                        officeName:data[i][2],
                                        counsilorId: data[i][3],
                                        officeId:data[i][4]
                                    })

                                    var rowData = [data[i][0], data[i][1], data[i][2]]; 
                                    csvContent += rowData.join(',') + '\n';
                                }
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'Applicant_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.blob(blob);
                                self.fileName(fileName);
                            }
                            else{
                                self.recordsCount(0)
                                var csvContent = '';
                                var headers = ['Staff Name', 'Number Of Students', 'Office Name'];
                                csvContent += headers.join(',') + '\n';
                                var rowData = []; 
                                csvContent += rowData.join(',') + '\n';
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'Applicant_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.blob(blob);
                                self.fileName(fileName);
                            }
                            let popup = document.getElementById("progressBar");
                            popup.close();
                        }
                    })
                }

                self.filter = ko.observable('');

                self.handleValueChanged = () => {
                    self.filter(document.getElementById('filter').rawValue);
                };

                self.applicantReportDp = ko.computed(function () {
                    let filterCriterion = null;
                    if (self.filter() && self.filter() != '') {
                        filterCriterion = ojdataprovider_1.FilterFactory.getFilter({
                            filterDef: { text: self.filter() }
                        });
                    }
                    const arrayDataProvider = new ArrayDataProvider(self.applicantReport, { 
                        keyAttributes: 'DepartmentId'
                    });
                    
                    return new ListDataProviderView(arrayDataProvider, { filterCriterion: filterCriterion });
                }, self);

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

                self.studentList = ko.observableArray()

                self.viewFullStudentList = (e) => {
                    let userId = e.target.id;
                    let officeId = e.target.className;
                    let fromDate = self.fromDate()
                    let toDate = self.toDate();
                    let popup = document.getElementById("progressBar");
                    popup.open();
                    self.studentList([])
                    $.ajax({
                        url: BaseURL+"/getStudentList",
                        type: 'POST',
                        data: JSON.stringify({
                            fromDate: fromDate,
                            toDate: toDate,
                            officeId: officeId,
                            staffId: userId,
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
                                var headers = ['Student Id', 'Student Name', 'Staff', 'Status'];
                                csvContent += headers.join(',') + '\n';
                                for(var i=0;i<len;i++){
                                    self.studentList.push({
                                        studentId:data[i][0],
                                        studentName: `${data[i][1]} ${data[i][2]}`,
                                        staff: data[i][3],
                                        status: data[i][4],
                                    })

                                    var rowData = [data[i][0], `${data[i][1]} ${data[i][2]}`, data[i][3], data[i][4]]; 
                                    csvContent += rowData.join(',') + '\n';
                                }
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'Applicant_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.studentBlob(blob);
                                self.studentFileName(fileName);
                                let popup = document.getElementById("progressBar");
                                popup.close();
                                let popup1 = document.getElementById("studentList");
                                popup1.open();
                            }
                            else{
                                var csvContent = '';
                                var headers = ['Student Id', 'Student Name', 'Staff', 'Status'];
                                csvContent += headers.join(',') + '\n';
                                var rowData = []; 
                                csvContent += rowData.join(',') + '\n';
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'Applicant_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.studentBlob(blob);
                                self.studentFileName(fileName);
                                let popup = document.getElementById("progressBar");
                                popup.close();
                            }
                        }
                    })
                }

                self.studentBlob = ko.observable();
                self.studentFileName = ko.observable();
                self.studentFilter = ko.observable('');

                self.studentHandleValueChanged = () => {
                    self.studentFilter(document.getElementById('filter').rawValue);
                };

                self.studentListDp = ko.computed(function () {
                    let filterCriterion = null;
                    if (self.studentFilter() && self.studentFilter() != '') {
                        filterCriterion = ojdataprovider_1.FilterFactory.getFilter({
                            filterDef: { text: self.studentFilter() }
                        });
                    }
                    const arrayDataProvider = new ArrayDataProvider(self.studentList, { 
                        keyAttributes: 'studentId'
                    });
                    
                    return new ListDataProviderView(arrayDataProvider, { filterCriterion: filterCriterion });
                }, self);

                self.studentDataDownload = ()=>{
                    if(self.studentBlob() != undefined && self.studentFileName() != undefined){
                        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                            // For Internet Explorer
                            window.navigator.msSaveOrOpenBlob(self.studentBlob(), self.studentFileName());
                        } else {
                            // For modern browsers
                            var link = document.createElement('a');
                            link.href = window.URL.createObjectURL(self.studentBlob());
                            link.download = self.studentFileName();
                            link.style.display = 'none';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    }
                }

                self.closePopup = ()=>{
                    let popup = document.getElementById("studentList");
                    popup.close();
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
        return  ApplicantReport;
    }
);