define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider",
    "ojs/ojinputtext", "ojs/ojformlayout", "ojs/ojvalidationgroup", "ojs/ojselectsingle", "ojs/ojactioncard", "ojs/ojtable", "ojs/ojmenu"], 
    function (oj,ko,$, app, ArrayDataProvider) {

        class CounsellorDashboard {
            constructor(args) {
                var self = this;

                let BaseURL = sessionStorage.getItem("BaseURL")
                self.userId = ko.observable(sessionStorage.getItem("userId"));
                self.router = args.parentRouter;                

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

                self.cardAction = (event) => {
                    let cardId = event.currentTarget.id;
                    
                    if(cardId==1){
                        self.router.go({path : 'students'});
                    }
                    else if(cardId==2){
                        self.router.go({path : 'application'});
                    }
                    else{
                        self.router.go({path : 'finalchoiced'});
                    }
                };

                self.userOfficeId = ko.observable();
                self.userRole = ko.observable(sessionStorage.getItem("userRole"));
                self.userId = ko.observable();
                if(self.userRole()=="admin" || self.userRole()=="director"){
                    self.userOfficeId("All")
                    self.userId("All")
                }
                else if(self.userRole()=="manager"){
                    self.userOfficeId(sessionStorage.getItem("userOfficeId"));
                    self.userId("All")
                }
                else{
                    self.userOfficeId(sessionStorage.getItem("userOfficeId"));
                    self.userId(sessionStorage.getItem("userId"))
                }

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
                
                self.yearChanged = (e)=>{
                    sessionStorage.setItem("selectYear", self.selectYear());
                    self.getDashboardCount();
                }

                self.studentData = ko.observableArray([]);
                self.getStudentsData = ()=>{
                    $.ajax({
                        url: BaseURL+"/getCounsilorStudents",
                        type: 'POST',
                        data: JSON.stringify({
                            counsilorId: self.userId(),
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0]!="No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                self.assignedLeadsCount(len);
                                for(var i=0;i<len;i++){
                                    var date = data[i][6];
                                    date = new Date(date);
                                    var year = date.getFullYear();
                                    var month = ('0' + (date.getMonth() + 1)).slice(-2);
                                    var day = ('0' + date.getDate()).slice(-2);
                                    date =  `${day}-${month}-${year}`
                                    self.studentData.push({
                                        id: data[i][0],
                                        firstName: data[i][4],
                                        lastName: data[i][5],
                                        office: data[i][3],
                                        destination: data[i][8],
                                        dateSubmitted: date,
                                        status: data[i][7]
                                    })
                                }
                            }
                            else{
                                self.assignedLeadsCount(0);
                            }
                        }
                    })
                }
                self.getStudentsData()
                self.studentDataProvider = new ArrayDataProvider(self.studentData, {
                    keyAttributes: 'id'
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
                    const context = document.getElementById("table").getContextByNode(target);
                    self.stIdRightClick(context.key);
                };

                self.connected = function () {
                    if (sessionStorage.getItem("userName") == null) {
                        self.router.go({path : 'signin'});
                    }
                    else {
                        app.onAppSuccess();
                        var routes = args.parentRouter._routes;
                        if(routes[11].path!="counsellorDashboard"){
                            location.reload();
                        }
                        self.getDashboardCount()
                    }
                }
            }
        }
        return  CounsellorDashboard;
    }
);