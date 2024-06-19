define(['ojs/ojcore',"knockout","jquery","appController", "ojs/ojarraydataprovider",
    "ojs/ojinputtext", "ojs/ojformlayout", "ojs/ojvalidationgroup", "ojs/ojselectsingle", "ojs/ojtable", 
    "ojs/ojinputsearch", "ojs/ojmenu"], 
    function (oj,ko,$, app, ArrayDataProvider) {

        class SearchStudent {
            constructor(args) {
                var self = this;

                self.selectSearch = ko.observable();
                self.keyword = ko.observable('');
                
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

                self.officeId = ko.observable();
                self.userRole = ko.observable(sessionStorage.getItem("userRole"));
                self.franchiseId = ko.observable();
        
                self.officeId(sessionStorage.getItem("userOfficeId"));
                self.franchiseId(sessionStorage.getItem("userFranchiseId"))
        
                self.student = ko.observable();
                self.students = [];
                self.getFranchiseStudents = ()=>{
                    $.ajax({
                        url: BaseURL+"/getFranchiseStudents",
                        type: 'POST',
                        data: JSON.stringify({
                            officeId: self.officeId(),
                            franchiseId: self.franchiseId()
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                let len = data.length;
                                for(var i=0;i<len;i++){
                                    self.students.push({value: `${data[i][0]}`, label: `${data[i][0]}. ${data[i][1]} ${data[i][2]}`})
                                }
                            }
                        }
                    })
                }
                self.getFranchiseStudents()
                self.studentsDP = new ArrayDataProvider(self.students, {
                    keyAttributes: "value",
                });

                self.handleValueAction = (event) => {
                    self.studentData([])
                    let studentDetails = self.student().split(". ");
                    $.ajax({
                        url: BaseURL+"/searchStudents",
                        type: 'POST',
                        data: JSON.stringify({
                            studentId: studentDetails[0]
                        }),
                        dataType: 'json',
                        error: function (xhr, textStatus, errorThrown) {
                            console.log(textStatus);
                        },
                        success: function (data) {
                            if(data[0] != "No data found"){
                                data = JSON.parse(data);
                                self.studentData.push({
                                    id: data[0][0],
                                    firstName: data[0][3],
                                    lastName: data[0][4]
                                });
                            }
                        }
                    })
                }

                self.studentData = ko.observableArray([]);
                self.searchDataProvider = new ArrayDataProvider(self.studentData, {
                    keyAttributes: 'id'
                });

                self.viewProfile = (e)=>{
                    // window.location.href = `/?ojr=studentProfile&id=${e.currentTarget.id}`;
                    window.open(`/?ojr=franchiseStudentProfile&id=${e.currentTarget.id}`, "_blank");
                }

                self.stIdRightClick = ko.observable();
                self.myActionFunction = (event) => {
                    let menu = event.detail.selectedValue;
                    if(menu=="openNewTab"){
                        if(self.stIdRightClick()!=undefined){
                            window.open(`/?ojr=franchiseStudentProfile&id=${self.stIdRightClick()}`, "_blank");
                        }
                    }
                };

                self.myBeforeOpenFunction = (event) => {
                    const target = event.detail.originalEvent.target;
                    const context = document.getElementById("table").getContextByNode(target);
                    self.stIdRightClick(context.key);
                };
            }
        }
        return  SearchStudent;
    }
);