define(["knockout","jquery","appController", "ojs/ojarraydataprovider", 
        "ojs/ojinputtext", "ojs/ojformlayout", "ojs/ojvalidationgroup", "ojs/ojselectsingle", 
        "ojs/ojactioncard", "ojs/ojtable", "ojs/ojselectcombobox", "ojs/ojpopup", "ojs/ojprogress-circle", "ojs/ojmenu"], 
    function (ko,$, app, ArrayDataProvider) {

        class Dashboard {
            constructor(args) { 
                var self = this;

                let BaseURL = sessionStorage.getItem("BaseURL")
                
                self.years = ko.observable();
                const currentYear = new Date().getFullYear();
                self.selectYear = ko.observable(currentYear.toString());

                if(sessionStorage.getItem("selectYear")==null || self.selectYear()==currentYear){
                    sessionStorage.setItem("selectYear", self.selectYear())
                }

                const years = [];
                for (let year = currentYear+2; year >= 2022; year--) {
                    years.push({ value: `${year}`, label: `${year}`})
                }
                self.years(years);
                self.yearsDp = new ArrayDataProvider(self.years(), {
                    keyAttributes: 'value'
                });
                //-----------------Started card functionalities----------------------//


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

                self.yearChanged = ()=>{
                    sessionStorage.setItem("selectYear", self.selectYear());
                    self.getDashboardCount();
                }
                //-----------------Completed card functionalities----------------------//

                //-----------------Started Table unassigned and assigned leads functionalities----------------------//

                self.tabData = [
                    { id: "unassigned", label: "Unassigned Leads Status" },
                    { id: "assigned", label: "Assigned Leads Status" },
                ];

                self.unAssignedData = ko.observableArray();

                self.selectedTab = ko.observable("unassigned");
                self.selectedTabAction = ko.computed(() => {                    
                    if(self.selectedTab()=="assigned"){
                        let popup = document.getElementById("progressBar");
                        popup.open();

                        let unAssignedLeadCount = document.getElementById("unAssignedLeadCount")
                        unAssignedLeadCount.style.display = "none"
                        let assignedLeadCount = document.getElementById("assignedLeadCount")
                        assignedLeadCount.style.display = "block"
                        let offices = self.office()
                        if(self.office()==undefined){
                            offices = ["All"]
                        }
                        else if( self.office().length==0 ){
                            self.office([""])
                            offices = [""]
                        }
                        const index = offices.indexOf("All");
                        if (index > -1) {
                            self.getassignedAllStudents();   
                        }
                        else {
                            offices = offices.join(',');
                            if(offices==""){
                                self.assignedData([]);
                            }
                            else{
                                self.getAssignedStudents(offices);
                            }
                        }
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

                            if(self.office()==undefined){
                                self.office(["All"]);
                            }
                            else if( self.office().length==0 ){
                                self.office([""])
                            }
                            const index = self.office().indexOf("All");
                            if (index > -1) {
                                self.getunassignedAllStudents();   
                            }
                            else {
                                let offices = self.office().join(',');
                                if(offices==""){
                                    self.unAssignedData([]);
                                }
                                else{
                                    self.getUnassignedStudents(offices);
                                }
                            }
                            unassigndiv.style.display = "block"
                            let assigndiv = document.getElementById("assignedLeads");
                            assigndiv.style.display = "none"
                            
                            popup = document.getElementById("progressBar");
                            popup.close();
                        }
                    }
                });

                self.office = ko.observable();
                self.offices = ko.observableArray([]);
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
                                self.offices([])
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

                self.officeChangedHandler = (event) => {
                    let offices = event.detail["value"];
                    if(offices.length==0){
                        self.office([""]);
                        offices = [""];
                    }
                    const index = offices.indexOf("All");
                    if (index > -1) {
                        self.getunassignedAllStudents();
                        self.getassignedAllStudents();   
                    }
                    else {
                        offices = offices.join(',');
                        if(offices==""){
                            self.unAssignedData([]);
                            self.assignedData([]);
                        }
                        else{
                            self.getUnassignedStudents(offices);
                            self.getAssignedStudents(offices);
                        }
                    }
                };

                self.counsilor = ko.observable();

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
                                resolve(data);
                            },
                            error: function (xhr, textStatus, errorThrown) {
                                reject('Error: ' + error);
                            }
                        });
                    });
                }

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
                            let offices = self.office();
                            if(offices!=undefined){
                                if(offices.length!=0){
                                    const index = offices.indexOf("All");
                                    if (index > -1 || index==undefined) {
                                        self.getunassignedAllStudents();
                                        self.getassignedAllStudents();   
                                    }
                                    else {
                                        offices = offices.join(', ');
                                        self.getUnassignedStudents(offices);
                                        self.getAssignedStudents(offices);
                                    }
                                }
                                else{
                                    self.getunassignedAllStudents();
                                    self.getassignedAllStudents(); 
                                }
                            }
                            else{
                                self.getunassignedAllStudents();
                                self.getassignedAllStudents(); 
                            }
                            self.getDashboardCount();
                        }
                    })
                };                

                self.getAllUnAssigned = ()=>{
                    return new Promise(function(resolve, reject) {
                        $.ajax({
                            url: BaseURL+"/getUnAssignedAllStudents",
                            type: 'GET',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                resolve(data);
                            }
                        })
                    });
                }
                
                self.getunassignedAllStudents = ()=>{
                    self.unAssignedData([]);
                    self.getAllUnAssigned().then(function(result1){
                        var promises = []
                        if(result1[0] != "No data found"){
                            var data = JSON.parse(result1);
                            let len = data.length;
                            promises.push(data)
                            for(var i=0;i<len;i++){
                                var promise = self.getCounselors(data[i][1])
                                promises.push(promise);
                            }
                            return Promise.all(promises);
                        }
                    })
                    .then(function(result2){
                        self.unAssignedData([]);
                        var studentData = result2[0]
                        var counsilorData = []
                        for(var i=1;i<result2.length;i++){
                            if(result2[i]!="No data found"){
                                result2[i] = JSON.parse(result2[i]);
                                counsilorData.push(result2[i]);
                            }
                        }
                        let len = studentData.length;
                        for(var i=0;i<len;i++){
                            var counselor = [];
                            var counselorList = new ArrayDataProvider(counselor, {
                                keyAttributes: 'value'
                            });
                            
                            if(counsilorData.length>0){
                                let len = counsilorData[i].length;
                                for(let j=0;j<len;j++){
                                    counselor.push({value: `${counsilorData[i][j][0]}`, label: `${counsilorData[i][j][1]}`})
                                }
                            }
                            else{
                                counselor.push({value: ``, label: ``})
                            }
                            counselorList = new ArrayDataProvider(counselor, {
                                keyAttributes: 'value'
                            });
                            var date = studentData[i][5];
                            date = new Date(date);
                            var year = date.getFullYear();
                            var month = ('0' + (date.getMonth() + 1)).slice(-2);
                            var day = ('0' + date.getDate()).slice(-2);
                            date =  `${day}-${month}-${year}`
                            self.unAssignedData.push({
                                id: studentData[i][0],
                                firstName: studentData[i][3],
                                lastName: studentData[i][4],
                                office: studentData[i][2],
                                destination: studentData[i][6],
                                counselors: counselorList,
                                dateSubmitted: date
                            })
                        }
                    })
                    .catch(function(error){
                        // console.error(error);
                    })
                }

                self.assignedData = ko.observableArray([]);
                
                self.getassignedAllStudents = ()=>{
                    self.assignedData([]);
                    $.ajax({
                        url: BaseURL+"/getassignedAllStudents",
                        type: 'GET',
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
                            else{
                                self.assignedLeadsCount(0)
                            }
                        }
                    })
                }

                self.getUnAssigned = (officeId)=>{
                    return new Promise(function(resolve, reject) {
                        $.ajax({
                            url: BaseURL+"/getUnassignedStudents",
                            type: 'POST',
                            data: JSON.stringify({
                                officeId: officeId
                            }),
                            dataType: 'json',
                            error: function (xhr, textStatus, errorThrown) {
                                console.log(textStatus);
                            },
                            success: function (data) {
                                resolve(data)
                            }
                        })
                    })
                }

                self.getUnassignedStudents = (officeId)=>{
                    self.unAssignedData([]);
                    self.getUnAssigned(officeId).then(function(result1){
                        var promises = []
                        if(result1[0] != "No data found"){
                            var data = JSON.parse(result1);
                            let len = data.length;
                            promises.push(data)
                            for(var i=0;i<len;i++){
                                var promise = self.getCounselors(data[i][1])
                                promises.push(promise);
                            }
                            return Promise.all(promises);
                        }
                    })
                    .then(function(result2){
                        var studentData = result2[0]
                        var counsilorData = []
                        for(var i=1;i<result2.length;i++){
                            result2[i] = JSON.parse(result2[i]);
                            counsilorData.push(result2[i]);
                        }
                        let len = studentData.length;

                        for(var i=0;i<len;i++){
                            var counselor = [];
                            var counselorList = new ArrayDataProvider(counselor, {
                                keyAttributes: 'value'
                            });
                            let len = counsilorData[i].length;
                            for(let j=0;j<len;j++){
                                counselor.push({value: `${counsilorData[i][j][0]}`, label: `${counsilorData[i][j][1]}`})
                            }
                            counselorList = new ArrayDataProvider(counselor, {
                                keyAttributes: 'value'
                            });
                            var date = studentData[i][5];
                            date = new Date(date);
                            var year = date.getFullYear();
                            var month = ('0' + (date.getMonth() + 1)).slice(-2);
                            var day = ('0' + date.getDate()).slice(-2);
                            date =  `${day}-${month}-${year}`
                            self.unAssignedData.push({
                                id: studentData[i][0],
                                firstName: studentData[i][3],
                                lastName: studentData[i][4],
                                office: studentData[i][2],
                                counselors: counselorList,
                                dateSubmitted: date
                            })
                        }
                    })
                    .catch(function(error){
                        // console.error(error);
                    })
                }

                self.getAssignedStudents = (officeId)=>{
                    self.assignedData([]);
                    $.ajax({
                        url: BaseURL+"/getAssignedStudents",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: officeId
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
                                        dateSubmitted: date,
                                        counsilor: data[i][7]
                                    })
                                }
                            }
                            else{
                                self.assignedLeadsCount(0)
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

                self.router = args.parentRouter;
                self.connected = function () {
                    if (sessionStorage.getItem("userName") == null) {
                        self.router.go({path : 'signin'});
                    }
                    else {
                        var routes = args.parentRouter._routes;
                        console.log(routes)
                        if(routes[10].path!="dashboard"){
                            location.reload();
                        }
                        else{
                            self.getDashboardCount();
                            self.getOffices();
                            self.getunassignedAllStudents();
                            app.onAppSuccess();
                        }
                    }
                }

            }
        }
        return  Dashboard;
    }
);