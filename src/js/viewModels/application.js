define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider",
    "ojs/ojlistdataproviderview","ojs/ojdataprovider",
    "ojs/ojinputtext", "ojs/ojformlayout", "ojs/ojvalidationgroup", "ojs/ojselectsingle", 
    "ojs/ojtable", "ojs/ojinputsearch", "ojs/ojmenu"], 
    function (oj,ko,$, app, ArrayDataProvider, ListDataProviderView, ojdataprovider_1) {

        class Application {
            constructor(args) {
                var self = this;
                self.router = args.parentRouter;
                let BaseURL = sessionStorage.getItem("BaseURL")
                
                self.officeId = ko.observable();
                self.userRole = ko.observable(sessionStorage.getItem("userRole"));
                self.userId = ko.observable();
                
                if(self.userRole()=="admin" || self.userRole()=="director"){
                    self.officeId("All")
                    self.userId("All")
                }
                else if(self.userRole()=="manager"){
                    self.officeId(sessionStorage.getItem("userOfficeId"));
                    self.userId("All")
                }
                else{
                    self.officeId(sessionStorage.getItem("userOfficeId"));
                    self.userId(sessionStorage.getItem("userId"))
                }

                self.year = ko.observable(sessionStorage.getItem("selectYear"));

                self.applicationCnt = ko.observable();
                self.offices = ko.observableArray();
                self.getOffices = ()=>{
                    $.ajax({
                        url: BaseURL+"/getOffices",
                        type: 'GET',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.offices([])
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.offices.push({value: `All`, label: `All`})
                                for(let i=0;i<len;i++){
                                    self.offices.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                }
                            }
                        }
                    })
                }
                self.officesList = new ArrayDataProvider(self.offices, {
                    keyAttributes: 'value'
                });

                self.officeChangeHandler = (e)=>{
                    self.getAllApplication()
                }

                self.applicationData = ko.observableArray([]);

                self.getAllApplication = ()=>{
                    $.ajax({
                        url: BaseURL+"/getApplications",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: self.officeId(),
                            userId: self.userId(),
                            year: self.year()
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            self.applicationData([]);  
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.applicationCnt(len)
                                for(var i=0;i<len;i++){
                                    self.applicationData.push({
                                        studentId: data[i][0],
                                        applicationId: data[i][1],
                                        university: data[i][2],
                                        courseName: data[i][3],
                                        courseStartDate: data[i][4],
                                        studentName: `${data[i][5]} ${data[i][6]}`,
                                        appSentDate: data[i][7]
                                    });
                                }
                            }
                            else{
                                self.applicationCnt(0)
                            }
                        }
                    })
                }
                
                self.comparator = (a, b) => {
                    if (a === b) {
                        return 0;
                    }
                    const dateA = new Date(a).getTime();
                    const dateB = new Date(b).getTime();
                    return dateA < dateB ? -1 : 1;
                };
                
                self.comparator = (a, b) => {
                    if (a === b) {
                        return 0;
                    }
                    const dateA = new Date(a).getTime();
                    const dateB = new Date(b).getTime();
                    return dateA < dateB ? -1 : 1;
                };
                
                self.filter = ko.observable('');

                self.applicationDataProvider = ko.computed(function () {
                    let filterCriterion = null;
                    if (self.filter() && this.filter() != '') {
                        filterCriterion = ojdataprovider_1.FilterFactory.getFilter({
                            filterDef: { text: self.filter() }
                        });
                    }
                    const arrayDataProvider = new ArrayDataProvider(self.applicationData, { 
                        keyAttributes: 'studentId',
                        sortComparators: {
                            comparators: new Map().set("courseStartDate", self.comparator),
                        },
                    });
                    
                    return new ListDataProviderView(arrayDataProvider, { filterCriterion: filterCriterion });
                }, self);

                self.handleValueChanged = () => {
                    self.filter(document.getElementById('filter').rawValue);
                };

                self.goToPage = (event)=>{
                    let url = event.srcElement.id;
                    var file=url.replace(/\s/g,'%20');
                    document.getElementById(url).href = file;
                }

                self.viewProfile = (e)=>{
                    // window.location.href = `/?ojr=studentProfile&id=${e.currentTarget.id}`;
                    window.open(`/?ojr=studentProfile&id=${e.currentTarget.id}`, "_blank");
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
                        self.getAllApplication()
                        self.getOffices()
                    }
                }
            }
        }
        return  Application;
    }
);