define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider",
    "ojs/ojinputtext", "ojs/ojformlayout", "ojs/ojvalidationgroup", "ojs/ojselectsingle", "ojs/ojactioncard", "ojs/ojtable",
    "ojs/ojpopup", "ojs/ojprogress-circle", "ojs/ojmenu"], 
    function (oj,ko,$, app, ArrayDataProvider) {

        class ManagerDashboard {
            constructor(args) {
                var self = this;

                let BaseURL = sessionStorage.getItem("BaseURL")
                self.userId = ko.observable(sessionStorage.getItem("userId"));
                self.router = args.parentRouter;

                self.userOfficeId = ko.observable();
                self.userRole = ko.observable(sessionStorage.getItem("userRole"));
                self.userId = ko.observable();
                
                self.userOfficeId(sessionStorage.getItem("userOfficeId"));
                self.userId("All")

                self.cardAction = (event) => {
                    let cardId = event.currentTarget.id;
                    
                    if(cardId==1){
                        self.router.go({path : 'students'});
                    }
                    else if(cardId==2){
                        self.router.go({path : 'application'});
                    }
                    else if(cardId==3){
                        self.router.go({path : 'finalchoiced'});
                    }
                    else{
                        self.router.go({path : 'unAssigned'});   
                    }
                };
                
                self.studentsCount = ko.observable();
                self.applicationCount = ko.observable();
                self.finalchoicedCount = ko.observable();
                self.unassignedLeadsCount = ko.observable();
                self.assignedLeadsCount = ko.observable();

                self.getDashboardCount = ()=>{
                    $.ajax({
                        url: BaseURL+"/getCountOfDashboard",
                        type: 'POST',
                        data: JSON.stringify({
                            year: self.selectYear(),
                            officeId: self.userOfficeId(),
                            userId: self.userId()
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            var studentCount = data[0][0][0]
                            var applicationCount = data[1][0][0]
                            var finalChoiceCount = data[2][0][0]
                            var unAssigneLeadCount = data[3][0][0]
                            if(studentCount=="No data found"){
                                self.studentsCount(0)
                            }
                            else{
                                self.studentsCount(studentCount)
                            }
                            if(applicationCount=="No data found"){
                                self.applicationCount(0)
                            }
                            else{
                                self.applicationCount(applicationCount)
                            }
                            if(finalChoiceCount=="No data found"){
                                self.finalchoicedCount(0)
                            }
                            else{
                                self.finalchoicedCount(finalChoiceCount)
                            }
                            if(unAssigneLeadCount=="No data found"){
                                self.unassignedLeadsCount(0)
                            }
                            else{
                                self.unassignedLeadsCount(unAssigneLeadCount)
                            }
                        }
                    })
                }

                self.years = ko.observable();
                const currentYear = new Date().getFullYear();
                self.selectYear = ko.observable(currentYear.toString());

                if(sessionStorage.getItem("selectYear")==null || self.selectYear()==currentYear){
                    sessionStorage.setItem("selectYear", self.selectYear())
                }

                const years = [];
                for (let year = currentYear; year >= 2022; year--) {
                    years.push({ value: `${year}`, label: `${year}`})
                }
                self.years(years);
                self.yearsDp = new ArrayDataProvider(self.years(), {
                    keyAttributes: 'value'
                });
                
                self.yearChanged = (e)=>{
                    sessionStorage.setItem("selectYear", self.selectYear());
                    self.getDashboardCount();
                }

                self.tabData = [
                    { id: "unassigned", label: "Unassigned Leads Status" },
                    { id: "assigned", label: "Assigned Leads Status" },
                ];

                self.selectedTab = ko.observable("unassigned");
                self.selectedTabAction = ko.computed(() => {                    
                    if(self.selectedTab()=="assigned"){
                        let popup = document.getElementById("progressBar");
                        popup.open();

                        let unAssignedLeadCount = document.getElementById("unAssignedLeadCount")
                        unAssignedLeadCount.style.display = "none"
                        let assignedLeadCount = document.getElementById("assignedLeadCount")
                        assignedLeadCount.style.display = "block"

                        self.getAssignedStudents();
                        let unassigndiv = document.getElementById("unassignedLeads");
                        unassigndiv.style.display = "none"
                        let assigndiv = document.getElementById("assignedLeads");
                        assigndiv.style.display = "block"
                        popup = document.getElementById("progressBar");
                        popup.close();
                    }
                    else{
                        let unassigndiv = document.getElementById("unassignedLeads");
                        if(unassigndiv!=null){
                            let popup = document.getElementById("progressBar");
                            popup.open();

                            let assignedLeadCount = document.getElementById("assignedLeadCount")
                            assignedLeadCount.style.display = "none"
                            let unAssignedLeadCount = document.getElementById("unAssignedLeadCount")
                            unAssignedLeadCount.style.display = "block"
                            
                            self.getUnassignedStudents();
                            unassigndiv.style.display = "block"
                            let assigndiv = document.getElementById("assignedLeads");
                            assigndiv.style.display = "none"
                            popup = document.getElementById("progressBar");
                            popup.close();
                        }
                    }
                });

                self.unAssignedData = ko.observableArray([]);

                self.counsilor = ko.observable();

                self.counsilors = ko.observableArray();

                self.getCounselors = (officeId)=>{
                    return new Promise(function(resolve, reject) {
                        $.ajax({
                            url: BaseURL+"/getCounselors",
                            type: 'POST',
                            data: JSON.stringify({
                                office: officeId,
                            }),
                            dataType: 'json',
                            success: function(data) {
                                self.counsilors([])
                                if(data[0] != "No data found"){
                                    data = JSON.parse(data);
                                    let len = data.length;
                                    for(let i=0;i<len;i++){
                                        self.counsilors.push({value: `${data[i][0]}`, label: `${data[i][1]}`})
                                    }
                                }
                            },
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            }
                        });
                    });
                }

                self.counselorList = new ArrayDataProvider(self.counsilors, {
                    keyAttributes: 'value'
                });

                self.counsellorActionHandler = (event) => {
                    let counsilor = event.detail.value;
                    let studentId = event.currentTarget.id;
                    $.ajax({
                        url: BaseURL+"/updateCounsilor",
                        type: 'POST',
                        data: JSON.stringify({
                            counsilorId: counsilor,
                            studentId: studentId
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        }, 
                        success: function (data) {
                            self.getUnassignedStudents();
                            self.getAssignedStudents();
                            self.getDashboardCount();
                        }
                    })
                };

                self.getUnassignedStudents = ()=>{
                    self.unAssignedData([]);
                    $.ajax({
                        url: BaseURL+"/getUnassignedStudents",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: self.userOfficeId()
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                var data = JSON.parse(data);
                                let len = data.length;
                                for(var i=0;i<len;i++){
                                    var date = data[i][5];
                                    date = new Date(date);
                                    var year = date.getFullYear();
                                    var month = ('0' + (date.getMonth() + 1)).slice(-2);
                                    var day = ('0' + date.getDate()).slice(-2);
                                    date =  `${day}-${month}-${year}`
                                    self.unAssignedData.push({
                                        id: data[i][0],
                                        firstName: data[i][3],
                                        lastName: data[i][4],
                                        office: data[i][2],
                                        destination: data[i][6],
                                        dateSubmitted: date,
                                    })
                                }
                                
                            }
                        }
                    })
                }

                self.assignedData = ko.observableArray([]);

                self.getAssignedStudents = ()=>{
                    self.assignedData([]);
                    $.ajax({
                        url: BaseURL+"/getAssignedStudents",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: self.userOfficeId()
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.assignedLeadsCount(len)
                                for(var i=0;i<len;i++){
                                    var date = data[i][6];
                                    date = new Date(date);
                                    var year = date.getFullYear();
                                    var month = ('0' + (date.getMonth() + 1)).slice(-2);
                                    var day = ('0' + date.getDate()).slice(-2);
                                    date =  `${day}-${month}-${year}`
                                    self.assignedData.push({
                                        id: data[i][0],
                                        firstName: data[i][4],
                                        lastName: data[i][5],
                                        office: data[i][3],
                                        destination: data[i][8],
                                        dateSubmitted: date,
                                        counsilor: data[i][7]
                                    })
                                }
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

                self.unAssignedDataprovider = new ArrayDataProvider(self.unAssignedData, {
                    keyAttributes: 'id',
                    sortComparators: {
                        comparators: new Map().set("dateSubmitted", self.comparator),
                    },
                });

                self.assignedDataprovider = new ArrayDataProvider(self.assignedData, {
                    keyAttributes: 'id',
                    sortComparators: {
                        comparators: new Map().set("dateSubmitted", self.comparator),
                    },
                });

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
                    let context = document.getElementById("table").getContextByNode(target);
                    if(context==null){
                        context = document.getElementById("table1").getContextByNode(target);
                    }
                    self.stIdRightClick(context.key);
                };

                self.connected = function () {
                    if (sessionStorage.getItem("userName") == null) {
                        self.router.go({path : 'signin'});
                    }
                    else {
                        app.onAppSuccess();
                        var routes = args.parentRouter._routes;
                        if(routes[12].path!="managerDashboard"){
                            location.reload();
                        }
                        self.getDashboardCount();
                        self.getUnassignedStudents();
                        self.getCounselors(sessionStorage.getItem("userOfficeId"));
                    }
                }
            }
        }
        return  ManagerDashboard;
    }
);