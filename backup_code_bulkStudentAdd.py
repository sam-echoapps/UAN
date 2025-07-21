class bulkStudentAdd1(Resource):
    def post(self):
        file = request.files.get('file')
        officeId = request.form.get("officeId")
        counsilorId = request.form.get("counsilorId")
        addUserId = request.form.get("addUserId")
        filename = secure_filename(file.filename)
        bulkStudent = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor(buffered=True)
        last_insert_id = ""
        df = ""
        validFile = False
        try:
            file_extension = file.filename.rsplit('.', 1)[1].lower()

            if file_extension == 'xlsx':
                df = pd.read_excel(file, encoding='iso-8859-1')
                validFile = True
            elif file_extension == 'csv':
                df = pd.read_csv(file, encoding='iso-8859-1')
                validFile = True
            else:
                validFile = False

            if (validFile):
                excelForm = True
                if "FirstName" in df.columns:
                    firstNameList = df["FirstName"].tolist()
                else:
                    bulkStudent.append('FirstName column is missing')
                    excelForm = False
                if "LastName" in df.columns:
                    lastNameList = df["LastName"].tolist()
                else:
                    bulkStudent.append('LastName column is missing')
                    excelForm = False
                if "Country Code" in df.columns:
                    countryCodeList = df["Country Code"].tolist()
                else:
                    bulkStudent.append('Country Code column is missing')
                    excelForm = False
                if "Phone" in df.columns:
                    phoneList = df["Phone"].tolist()
                else:
                    bulkStudent.append('Phone column is missing')
                    excelForm = False
                if "Email" in df.columns:
                    emailList = df["Email"].tolist()
                else:
                    bulkStudent.append('Email column is missing')
                    excelForm = False
                if "Intrested Course" in df.columns:
                    courseList = df["Intrested Course"].tolist()
                else:
                    courseList = [""] * len(firstNameList)

                if (excelForm):
                    length = len(firstNameList)

                    for i in range(0, length):
                        if isinstance(firstNameList[i], float):
                            firstNameList[i] = ""
                        if isinstance(lastNameList[i], float):
                            lastNameList[i] = ""
                        if math.isnan(countryCodeList[i]):
                            countryCode = ""
                        else:
                            countryCode = int(countryCodeList[i])
                        if math.isnan(phoneList[i]):
                            phone = ""
                        else:
                            phone = int(phoneList[i])
                        if isinstance(emailList[i], float):
                            emailList[i] = ""
                        if isinstance(courseList[i], float):
                            courseList[i] = ""
                        firstName = firstNameList[i]
                        lastName = lastNameList[i]
                        email = emailList[i]
                        course = courseList[i]

                        if countryCode != "":
                            countryCode = "+" + str(countryCode)

                        sqlCheckEmailExist = """select COUNT(*) from students where email=%s"""
                        value = (email,)
                        cursor.execute(sqlCheckEmailExist, value)
                        row_count = cursor.fetchone()[0]
                        if (row_count == 0):
                            sqlbulkAdd = """insert into students(counsilor_id, office_id, first_name, last_name, country_code, mobile_no, email, course, lead_source, status)
                                             values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
                            bulkAddValue = (
                            counsilorId, officeId, firstName, lastName, countryCode, phone, email, course,
                            "Bulk Upload", "Lead")
                            cursor.execute(sqlbulkAdd, bulkAddValue)
                            last_insert_id = cursor.lastrowid
                        else:
                            sqlUpdateStud = """update students set counsilor_id=%s, office_id=%s, first_name=%s, last_name=%s, country_code=%s, mobile_no=%s,
                                                course=%s, lead_source=%s, status=%s where email=%s"""
                            value = (
                            counsilorId, officeId, firstName, lastName, countryCode, phone, course, "Bulk Upload",
                            "Lead", email)
                            cursor.execute(sqlUpdateStud, value)
                            sqlGetStudentId = """select student_id from students where email=%s"""
                            value = (email,)
                            cursor.execute(sqlGetStudentId, value)
                            last_insert_id = cursor.fetchone()[0]

                        sqlAddNote = """insert into notes(student_id, counsilor_id, note, contact_type, lead_source)
                                                        values (%s, %s, %s, %s, %s)"""
                        noteAddValue = (last_insert_id, addUserId, "Lead added via bulk upload ", "Bulk upload", "")
                        cursor.execute(sqlAddNote, noteAddValue)

                    sqlGetCounselorName = """select name, username from users where user_id=%s"""
                    value = (counsilorId,)
                    cursor.execute(sqlGetCounselorName, value)
                    counselorDetail = cursor.fetchone()
                    counselorName = counselorDetail[0]
                    counselorMail = counselorDetail[1]

                    htmlContent = f"<p>Hi {counselorName},</p><p>You have been assigned a new set of students</p>" \
                                  f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
                    sendMail('Bulk Students Assigned', htmlContent, counselorMail)

                    sqlGetManager = """select name, username from users where office_id=%s and role=%s AND username != 'rajindersingh@uan-networks.com'"""
                    value = (officeId, "manager",)
                    cursor.execute(sqlGetManager, value)
                    managerDetails = cursor.fetchall()
                    if (managerDetails):
                        for managerDetail in managerDetails:
                            managerName = managerDetail[0]
                            managerMail = managerDetail[1]
                            htmlContent = f"<p>Hi {managerName},</p><p>Your office has been assigned a new set of students</p>" \
                                          f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
                            sendMail('New Student Added', htmlContent, managerMail)

                    htmlContent = f"<p>Hi Admin,</p><p>You have Bulk students registration</p>" \
                                  f"<p>Thanks<br>UAN Team</p>"
                    sendMail('Bulk Students Assigned', htmlContent, adminMail)
                    bulkStudent.append('Students Added')
                    bulkStudent.append('Sucessfully Sent Email')
            else:
                bulkStudent.append('Invalid file format')

        except FileNotFoundError:
            bulkStudent.append("Error: The specified file does not exist.")
        except pd.errors.EmptyDataError:
            bulkStudent.append("Error: The file is empty or contains no data.")
        except pd.errors.ParserError:
            bulkStudent.append("Error: Unable to parse the Excel file. Make sure the file format is correct.")
        except Exception as e:
            bulkStudent.append(f"An unexpected error occurred: {e}")
        except OSError as e:
            bulkStudent.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return bulkStudent
