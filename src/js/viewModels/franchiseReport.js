define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider", "ojs/ojlistdataproviderview","ojs/ojdataprovider", 
    "ojs/ojconverterutils-i18n",
    "ojs/ojbutton", "ojs/ojtable", "ojs/ojinputtext", "ojs/ojselectsingle", "ojs/ojdialog", "ojs/ojvalidationgroup", "ojs/ojformlayout", 
    "ojs/ojinputtext", "ojs/ojprogress-circle", "ojs/ojselectcombobox", "ojs/ojdatetimepicker", "ojs/ojinputnumber", "ojs/ojswitcher","ojs/ojradioset"], 
    function (oj,ko,$, app, ArrayDataProvider, ListDataProviderView, ojdataprovider_1, ojconverterutils_i18n_1) {

        class FranchiseReport {
            constructor() {
                var self = this;
                let BaseURL = sessionStorage.getItem("BaseURL");

                const currentDate = new Date();
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const day = currentDate.getDate();
                self.applicationFromValue = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year, 0, 1)));
                self.applicationToValue = ko.observable(ojconverterutils_i18n_1.IntlConverterUtils.dateToLocalIsoDateString(new Date(year, month,day)));
                self.selectApplicationRadio = ko.observable("ASD"); 
                self.franchise = ko.observable(["All"]);

                self.countries = ko.observableArray()
                self.countries.push(
                    {value: 'All', label: 'All'},
                    {"label":"UK","value":"UK"},
                    {"label":"Canada","value":"Canada"},
                    {"label":"USA","value":"USA"},
                    {"label":"Australia","value":"Australia"}),
                self.countrySet = new ArrayDataProvider(self.countries, {
                    keyAttributes: 'value'
                });
                self.country = ko.observable(["All"]);
                self.franchises = ko.observableArray([]);
                self.applicationData = ko.observableArray();
                self.applicationCountData = ko.observableArray();
                self.applicationBlob = ko.observable();
                self.applicationFileName = ko.observable();

                self.connected = function () {
                    if (sessionStorage.getItem("userName") == null) {
                        self.router.go({path : 'signin'});
                    }
                    else {
                        app.onAppSuccess();
                        self.getFranchises(); 
                    }
                }

                self.getFranchises = ()=>{
                    return new Promise((resolve, reject) => {
                        self.franchises([])
                        $.ajax({
                            url: BaseURL+"/getFranchises",
                            type: 'GET',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                if(data[0] != "No data found"){
                                    data = JSON.parse(data);
                                    self.franchises([])
                                    self.franchises.push({value: `All`, label: `All`})
                                    let len = data.length;
                                    for(let i=0;i<len;i++){
                                        self.franchises.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                    }
                                }
                            }
                        })
                        setTimeout(() => { resolve(); }, 1000);
                    });
                }
                
                self.franchisesList = new ArrayDataProvider(self.franchises, {
                    keyAttributes: 'value'
                });

                self.viewApplications = ()=>{
                    self.applicationData([]);
                    self.showApplicationCountData()
                    
                    let fromDate = self.applicationFromValue()
                    let toDate = self.applicationToValue();
                    let franchise = self.franchise();
                    franchise = franchise.join(",");
                    let country = self.country();
                    country = country.join(",");
                    let radio = self.selectApplicationRadio();
                    let popup = document.getElementById("progress");
                    popup.open();
                    let dataUrl = "/getFranchiseReportApplicationsASD"
                    if(radio=="CSD"){
                        dataUrl = "/getFranchiseReportApplicationsCSD"   
                    }
                    $.ajax({
                        url: BaseURL+dataUrl,
                        type: 'POST',
                        data: JSON.stringify({
                            franchiseId:franchise,
                            fromDate: fromDate,
                            toDate: toDate,
                            countryId: country,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            let popup = document.getElementById("progress");
                            popup.close();
                            var csvContent = '';
                            var headers = ['Student Id', 'Course', 'Name','Application Send Date', 'Course Start Date', 
                                        'Offer', 'Nationality',  'Mobile', 'Email', 'Lead Source', 'UTM Source', 'Franchise Name','Signed By','COA'];
                            csvContent += headers.join(',') + '\n';
                            if(data[0]!='No data found'){
                                data = JSON.parse(data);
                                console.log(data)
                                let len = data.length;

                                for(let i=0;i<len;i++){
                                    self.applicationData.push({
                                        "studentId" : data[i][0],
                                        "course" : data[i][1],
                                        "name" : data[i][2]+" "+data[i][3],
                                        "asd" : data[i][4],
                                        "csd" : data[i][5],
                                        "offer" : data[i][6],
                                        "nationality" : data[i][7],
                                        "mobile" : data[i][8],
                                        "email" : data[i][9],
                                        "leadSource" : data[i][10],
                                        "utmSource" : data[i][11],
                                        "franchiseName" : data[i][12]+" "+data[i][13],
                                        "signedBy" : data[i][14],
                                        "coa" : data[i][15]
                                    });
                                    var rowData = [data[i][0], data[i][1], data[i][2]+" "+data[i][3], data[i][4], data[i][5], data[i][6], data[i][7], 
                                                data[i][8], data[i][9], data[i][10], data[i][11], data[i][12], data[i][13], data[i][14], data[i][15] ]; 
                                    csvContent += rowData.join(',') + '\n';
                                }
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'Application_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.applicationBlob(blob);
                                self.applicationFileName(fileName);
                            }
                            else{
                                var rowData = []; 
                                csvContent += rowData.join(',') + '\n';
                                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                var today = new Date();
                                var fileName = 'Application_Report_' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '.csv';
                                self.applicationBlob(blob);
                                self.applicationFileName(fileName);
                            }
                        }
                    })
                }
                self.applicationDataprovider = new ArrayDataProvider(self.applicationData, { keyAttributes: 'id' });

                self.showApplicationCountData = ()=>{
                    let fromDate = self.applicationFromValue()
                    let toDate = self.applicationToValue();
                    let franchise = self.franchise();
                    franchise = franchise.join(",");
                    let country = self.country();
                    country = country.join(",");
                    let radio = self.selectApplicationRadio();
                    let dataUrl = "/getFranchiseReportApplicationCountASD"
                    if(radio=="CSD"){
                        dataUrl = "/getFranchiseReportApplicationCountCSD"   
                    }
                    self.applicationCountData([])
                    $.ajax({
                        url: BaseURL+dataUrl,
                        type: 'POST',
                        data: JSON.stringify({
                            franchiseId:franchise,
                            fromDate: fromDate,
                            toDate: toDate,
                            countryId: country,
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            console.log(data)
                            if(data[0]!='No data found'){
                                data = JSON.parse(data);
                                let len = data.length;
                                for(let i=0;i<len;i++){
                                    self.applicationCountData.push({
                                        franchiseName: data[i][6] + " " + data[i][7],
                                        totalApplications: data[i][0],
                                        totalConditional: data[i][2],
                                        totalUnconditional: data[i][1],
                                        totalRejected: data[i][3],
                                        totalPending: data[i][4],
                                        totalWithdrawn: data[i][8],
                                        totalCoursefull: data[i][9],
                                        totalApplicants: data[i][10],
                                        totalFinalChoice: data[i][11]
                                    });
                                }
                            }
                        }
                    })
                }

                self.applicationCountdataprovider = new ArrayDataProvider(self.applicationCountData, { keyAttributes: 'id' });

                self.downloadApplicationData = ()=>{
                    //self.showApplicationCountData()
                        if(self.applicationBlob() != undefined && self.applicationFileName() != undefined){
                            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                                window.navigator.msSaveOrOpenBlob(self.applicationBlob(), self.applicationFileName());
                            } else {
                                var link = document.createElement('a');
                                link.href = window.URL.createObjectURL(self.applicationBlob());
                                link.download = self.applicationFileName();
                                link.style.display = 'none';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }
                        }
            }


            }
        }
        return  FranchiseReport;
    }
);