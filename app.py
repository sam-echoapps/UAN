import select
import json
from flask import Flask, g, jsonify, request, send_file, make_response
from flask_restful import reqparse, abort, Api, Resource
from werkzeug.utils import secure_filename
import logging
import binascii
import cx_Oracle
import mysql.connector as mysql
import os
import pandas as pd
import time
from datetime import datetime, timezone, timedelta
import configparser
from flask_cors import CORS
import base64
from Crypto.Cipher import AES
import string
from cryptography.fernet import Fernet
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import date
from gunicorn.glogging import Logger
import schedule
import threading
import pytz
import math
import re
import random

app = Flask(__name__, static_folder="./web", static_url_path="/")
CORS(app)
api = Api(app)

sshTimeOut = 120

config = configparser.RawConfigParser()
config.read('config/oneplace.cfg')
oneplace_base = config.get('ONEPLACE_CONFIG', 'BASE_DIR')
oneplace_home = config.get('ONEPLACE_CONFIG', 'HOME_DIR')
dbUser = config.get('ONEPLACE_CONFIG', 'DB_USER')
dbPassword = config.get('ONEPLACE_CONFIG', 'DB_PASSWD')
dataBase = config.get('ONEPLACE_CONFIG', 'DB_NAME')
# adminMail  = config.get('ONEPLACE_CONFIG','ADMIN_EMAIL')
UPLOAD_FOLDER = config.get('ONEPLACE_CONFIG', 'UPLOAD_FOLDER')
CONTRACT_FOLDER = config.get('ONEPLACE_CONFIG', 'CONTRACT_FOLDER')
senderMail  = config.get('ONEPLACE_CONFIG','Sender_EMAIL')
senderPassword  = config.get('ONEPLACE_CONFIG','Sender_Password')
# print(senderMail)
# print(senderPassword)

LOG_FORMAT = "[%(asctime)s] %(levelname)s - %(message)s"
logging.basicConfig(filename=os.path.join(oneplace_home, 'oneperror.log'), level=logging.INFO, format=LOG_FORMAT)
logger = logging.getLogger()

cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
cursor = cnx.cursor()
cursor.execute("SELECT email FROM users WHERE role = %s", ("admin",))
adminEmail = cursor.fetchone()
adminMail = ""
if adminEmail:
    adminMail = adminEmail[0]


@app.route("/")
def index():
    return app.send_static_file("index.html")


def output_type_handler(cursor, name, defaultType, size, precision, scale):
    return cursor.var(cx_Oracle.STRING, 255, arraysize=cursor.arraysize)


def dataframe_difference(df1, df2, which=None):
    """Find rows which are different between two DataFrames."""
    comparison_df = df1.merge(df2,
                              indicator=True,
                              how='outer')
    if which is None:
        diff_df = comparison_df[comparison_df['_merge'] != 'both']
    else:
        diff_df = comparison_df[comparison_df['_merge'] == which]
    return diff_df


def chmod_dir(path):
    for root, dirs, files in os.walk(path):
        for d in dirs:
            os.chmod(os.path.join(root, d), 0o755)
        for f in files:
            os.chmod(os.path.join(root, f), 0o755)


def OPlaceDebug(filename):
    if OPlace_Debug == 'N':
        for name in filename:
            if os.path.exists(os.path.join(oneplace_home, name)):
                os.remove(os.path.join(oneplace_home, name))


def sendMail(subject, content, mailId):
    sender_name = 'Admin UAN'
    sender_email = senderMail
    sender_password = senderPassword
    receiver_email = mailId
    subject = subject
    html = content

    msg = MIMEMultipart()
    msg['From'] = f'{sender_name} <{sender_email}>'
    msg['To'] = receiver_email
    msg['Subject'] = subject

    msg.attach(MIMEText(html, "html"))
    try:
        server = smtplib.SMTP('mail.uan-networks.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, receiver_email, text)
        server.quit()
    except Exception as e:
        logging.error("An error occurred while sending the email:", str(e))


def sendReminderMail():
    cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
    cursor = cnx.cursor()
    try:
        sqlGetReminderNotes = """
                            select reminder_date, note, first_name, last_name, note_user.name as noteAddedStaff, 
                            student_user.name as counsellor, note_user.email as noteAddedStaffEmail, 
                            student_user.email as counselloremail from notes 
                            left outer join users as note_user on note_user.user_id=notes.counsilor_id 
                            left outer join students on students.student_id=notes.student_id 
                            left outer join users as student_user on student_user.user_id = students.counsilor_id 
                            where reminder_date is not null AND notes.status=1"""
        cursor.execute(sqlGetReminderNotes, ())
        reminderNotes = cursor.fetchall()
        if reminderNotes:
            for reminderNote in reminderNotes:
                reminderDate = reminderNote[0]
                note = reminderNote[1]
                studentName = reminderNote[2] + " " + reminderNote[3]
                staffName = reminderNote[4]
                counselorName = reminderNote[5]
                staffEmail = reminderNote[6]
                counselorEmail = reminderNote[7]

                current_date = datetime.now().date()
                if reminderDate == current_date:
                    htmlContent = f"<p>Hi {staffName},</p><br><p>You have a reminder log for today.</p><p> student: {studentName}.</p><p>Reminder text: {note}</p>" \
                                  f"<p>Please take the necessary action and mark the reminder as done.</p><br><p>Thanks<br>UAN CRM system</p>"
                    sendMail('Reminder Mail Alert', htmlContent, staffEmail)
                    if staffEmail != counselorEmail:
                        htmlContent = f"<p>Hi {counselorName},</p><br><p>You have a reminder log for today.</p><p> student: {studentName}.</p><p>Reminder text: {note}</p>" \
                                      f"<p>Please take the necessary action and mark the reminder as done.</p><br><p>Thanks<br>UAN CRM system</p>"
                        sendMail('Reminder Mail Alert', htmlContent, counselorEmail)
    except mysql.Error as e:
        logging.error("Error:", str(e))
    finally:
        cursor.close()


def schedule_email():
    while True:
        india_timezone = pytz.timezone('Asia/Kolkata')
        current_time = datetime.now(india_timezone)
        if ((current_time.hour == 9 and current_time.minute == 15) or (
                current_time.hour == 15 and current_time.minute == 15)):
            sendReminderMail()
        time.sleep(60)


thread = threading.Thread(target=schedule_email, args=())
thread.start()

# morning_thread = threading.Thread(target=schedule_email, args=(9, 0))
# morning_thread.start()
# morning_thread.join()
#
# afternoon_thread = threading.Thread(target=schedule_email, args=(15, 0))
# afternoon_thread.start()
# afternoon_thread.join()

# def schedule_function():
#     try:
#         schedule.every().day.at("09:00").do(sendReminderMail)
#         schedule.every().day.at("15:00").do(sendReminderMail)
#         while True:
#             schedule.run_pending()
#             time.sleep(1)
#     except Exception as e:
#         logging.error(str(e))


BS = 32
pad = lambda s: bytes(s + (BS - len(s) % BS) * chr(BS - len(s) % BS), 'utf-8')
unpad = lambda s: s[0:-ord(s[-1:])]


class AESCipher:
    def __init__(self, key):
        self.key = bytes(key, 'utf-8')

    def encrypt(self, raw):
        raw = pad(raw)
        iv = 'OnePlaceMyPlaceV'.encode('utf-8')
        cipher = AES.new(self.key, AES.MODE_CBC, iv)
        return base64.b64encode(cipher.encrypt(raw))

    def decrypt(self, enc):
        iv = 'OnePlaceMyPlaceV'.encode('utf-8')
        enc = base64.b64decode(enc)
        cipher = AES.new(self.key, AES.MODE_CBC, iv)
        return unpad(cipher.decrypt(enc)).decode('utf8')


cipher = AESCipher('OnePlaceMyPlaceJamboUrl111019808')


def hexConvert(filename):
    with open(os.path.join(oneplace_home, filename)) as infile:
        str = ''
        for line in infile:
            for word in line.split():
                str = str + word
    strAscii = binascii.unhexlify(str).decode('utf8')
    return strAscii


'''-------------------------------------------------------------------------------------------------------------------------'''


# New Changes
class uanLogin(Resource):
    def post(self):
        data = request.get_json(force=True)
        user = data['user']
        userpasswd = data['passwd']
        SignIn = 'N'
        userId = ''
        userName = ''
        userRole = ''
        name = ''
        officeId = ''
        partnerId = ''
        franchiseId = ''
        ErrPrint = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            cursor.execute(
                "SELECT user_id, username, password, role, password_key, name, office_id, partners_id,franchise_id FROM users WHERE username = %s and deactivate=0",
                (user,))
            user_row = cursor.fetchone()
            if user_row:
                seluser = user_row[1]
                selpasswd = user_row[2]
                key = user_row[4]
                fernet = Fernet(key)
                selpasswd = fernet.decrypt(selpasswd.encode()).decode()
                if seluser == user and selpasswd == userpasswd:
                    SignIn = 'Y'
                    userId = user_row[0]
                    userName = user_row[1]
                    userRole = user_row[3]
                    name = user_row[5]
                    officeId = user_row[6]
                    partnerId = user_row[7]
                    franchiseId = user_row[8]
                else:
                    SignIn = 'N'
                    ErrPrint.append('Invalid Login Credentials')
            else:
                SignIn = 'N'
                ErrPrint.append('Invalid Login Credentials')
        except mysql.Error as e:
            SignIn = 'N'
            ErrPrint.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return [ErrPrint, SignIn, userId, userName, userRole, name, officeId, partnerId, franchiseId]


class getOffices(Resource):
    def get(self):
        offices = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            cursor.execute(
                "select * from offices left outer join users on offices.manager_id=users.user_id where offices.deactivate=%s",
                (0,))
            offices_data = cursor.fetchall()
            if offices_data:
                offices = json.dumps(offices_data, default=str)
            else:
                offices.append('No data found')
        except mysql.Error as e:
            offices.append(str(e))
        finally:
            cursor.close()

        return offices


class student_register(Resource):
    def post(self):
        data = request.get_json(force=True)
        firstName = data['firstName']
        lastName = data['lastName']
        countryCode = data['countryCode']
        phone = data['phone']
        email = data['email']
        office = data['office']
        course = data['course']
        nationality = data['nationality']
        leadSource = data['leadSource']
        utmSource = data['utmSource']
        utmMedium = data['utmMedium']
        utmCampaign = data['utmCampaign']

        studyAbroadDestination = data["studyAbroadDestination"]
        addStudMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()

        try:
            sqlCheckEmailExist = """select COUNT(*) from students where email=%s"""
            value = (email,)
            cursor.execute(sqlCheckEmailExist, value)
            row_count = cursor.fetchone()[0]
            last_insert_id = ""
            if (row_count == 0):
                sqlStudentAdd = """insert into students(office_id, first_name, last_name, country_code, mobile_no, email, 
                                course, lead_source, nationality, status, study_abroad_destination, utm_source, utm_medium, utm_campaign)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                valStudAdd = (office, firstName, lastName, countryCode, phone, email, course, leadSource, nationality,
                              "Lead", studyAbroadDestination, utmSource, utmMedium, utmCampaign,)
                cursor.execute(sqlStudentAdd, valStudAdd)
                last_insert_id = cursor.lastrowid
                addStudMsg.append("Sucessfully Added the Student")
            else:
                sqlUpdateStud = """update students set office_id=%s, first_name=%s, last_name=%s,country_code=%s, mobile_no=%s,
                                course=%s, lead_source=%s, nationality=%s, status=%s, study_abroad_destination=%s, utm_source=%s, 
                                utm_medium=%s, utm_campaign=%s where email=%s"""
                value = (office, firstName, lastName, countryCode, phone, course, leadSource, nationality, "Lead",
                         studyAbroadDestination, utmSource, utmMedium, utmCampaign, email,)
                cursor.execute(sqlUpdateStud, value)

                sqlGetStudentId = """select student_id from students where email=%s"""
                value = (email,)
                cursor.execute(sqlGetStudentId, value)
                last_insert_id = cursor.fetchone()[0]
                addStudMsg.append("Personal data updated")
            sqlAddNote = """insert into notes(student_id, counsilor_id, note, contact_type, lead_source)
                            values (%s, %s, %s, %s, %s)"""
            value = (last_insert_id, "0", "Lead added via web registration", "Website", "")
            cursor.execute(sqlAddNote, value)
            if nationality == "nepalese":
                htmlContent = f"<p>Hi Admin,</p><p>You have a new student registration</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {last_insert_id}" \
                              f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                              f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
                sendMail('Registration form Student Added', htmlContent, "uandocuments7@gmail.com")
            elif nationality == "indian":
                htmlContent = f"<p>Hi Admin,</p><p>You have a new student registration</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {last_insert_id}" \
                              f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                              f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
                sendMail('Registration form Student Added', htmlContent, "mansi.s@uninetworks.co.uk")

            htmlContent = f"<p>Hi Admin,</p><p>You have a new student registration</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {last_insert_id}" \
                          f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                          f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
            sendMail('Registration form Student Added', htmlContent, adminMail)

            htmlContent = f"<p>Hi {firstName} {lastName},</p><p>Thank you for registering with us. Our team will get in touch with you soon.</p>" \
                          f"<p>Thanks<br>UAN Team</p>"
            sendMail('UAN Registration Success', htmlContent, email)

            addStudMsg.append('Sucessfully Sent Email')

        except mysql.Error as e:
            addStudMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return addStudMsg


class webSite_student_dataAdd(Resource):
    def post(self):
        data = request.get_json(force=True)


class addStudent(Resource):
    def post(self):
        data = request.get_json(force=True)
        firstName = data['firstName']
        lastName = data['lastName']
        countryCode = data["countryCode"]
        phone = data['phone']
        email = data['email']
        office = data['office']
        counselor = data['counselor']
        course = data['course']
        nationality = data['nationality']
        dob = data['dob']
        addUserId = data['addUserId']
        if (dob == ''):
            dob = null
        leadSource = data['leadSource']
        studyAbroadDestination = data["studyAbroadDestination"]
        addStudMsg = []
        last_insert_id = ""
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlCheckEmailExist = """select COUNT(*) from students where email=%s"""
            value = (email,)
            cursor.execute(sqlCheckEmailExist, value)
            row_count = cursor.fetchone()[0]
            if (row_count == 0):
                sqlStudentAdd = """insert into students(office_id, counsilor_id, first_name, last_name, country_code, mobile_no, email, course, lead_source, 
                                nationality, dob, status, study_abroad_destination)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                valStudAdd = (
                office, counselor, firstName, lastName, countryCode, phone, email, course, leadSource, nationality,
                dob, "Lead", studyAbroadDestination,)
                cursor.execute(sqlStudentAdd, valStudAdd)
                last_insert_id = cursor.lastrowid
                addStudMsg.append("Sucessfully Added the Student")
            else:
                sqlUpdateStud = """update students set office_id=%s, counsilor_id=%s, first_name=%s, last_name=%s,country_code=%s,
                                    mobile_no=%s, course=%s, lead_source=%s, nationality=%s, dob=%s, status=%s, study_abroad_destination=%s
                                    where email=%s"""
                value = (
                office, counselor, firstName, lastName, countryCode, phone, course, leadSource, nationality, dob,
                "Lead", studyAbroadDestination, email,)
                cursor.execute(sqlUpdateStud, value)
                sqlGetStudentId = """select student_id from students where email=%s"""
                value = (email,)
                cursor.execute(sqlGetStudentId, value)
                last_insert_id = cursor.fetchone()[0]
                addStudMsg.append("Personal data updated")

            sqlAddNote = """insert into notes(student_id, counsilor_id, note, contact_type, lead_source)
                                        values (%s, %s, %s, %s, %s)"""
            value = (last_insert_id, addUserId, "Lead added via Add student", leadSource, "")
            cursor.execute(sqlAddNote, value)

            sqlGetCounselorName = """select name, username from users where user_id=%s"""
            value = (counselor,)
            cursor.execute(sqlGetCounselorName, value)

            counselorDetail = cursor.fetchone()
            counselorName = counselorDetail[0]
            counselorMail = counselorDetail[1]

            htmlContent = f"<p>Hi {counselorName},</p><p>You have been assigned a new student</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {last_insert_id}" \
                          f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                          f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
            sendMail('New Student Assigned', htmlContent, counselorMail)

            sqlGetManager = """select name, username from users where office_id=%s and role=%s AND username != 'rajindersingh@uan-networks.com'"""
            value = (office, "manager",)
            cursor.execute(sqlGetManager, value)
            managerDetails = cursor.fetchall()
            if (managerDetails):
                for managerDetail in managerDetails:
                    managerName = managerDetail[0]
                    managerMail = managerDetail[1]
                    htmlContent = f"<p>Hi {managerName},</p><p>Your office has been assigned a new student</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {last_insert_id}" \
                                  f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                                  f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
                    sendMail('Registration form Student Added', htmlContent, managerMail)

            '''Mail send to student'''
            htmlContent = f"<p>Hi {firstName} {lastName},</p><p>Thank you for registering with us. Our team will get in touch with you soon.</p>" \
                          f"<p>Thanks<br>UAN Team</p>"
            sendMail('UAN Registration Successes', htmlContent, email)

            if nationality == "nepalese":
                htmlContent = f"<p>Hi UAN,</p><p>You have a new student registration</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {last_insert_id}" \
                              f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                              f"<p>Thanks<br>UAN Team</p>"
                sendMail('Registration form Student Added', htmlContent, "uandocuments7@gmail.com")
            elif nationality == "indian":
                htmlContent = f"<p>Hi Mansi,</p><p>You have a new student registration</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {last_insert_id}" \
                              f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                              f"<p>Thanks<br>UAN Team</p>"
                sendMail('Registration form Student Added', htmlContent, "mansi.s@uninetworks.co.uk")

            htmlContent = f"<p>Hi Admin,</p><p>You have a new student registration</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {last_insert_id}" \
                          f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                          f"<p>Thanks<br>UAN Team</p>"
            sendMail('Registration form Student Added', htmlContent, adminMail)

            addStudMsg.append('Sucessfully Sent Email')
        except mysql.Error as e:
            addStudMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return addStudMsg


class bulkStudentAdd(Resource):
    def post(self):
        file = request.files.get('file')
        officeId = request.form.get("officeId")
        counsilorId = request.form.get("counsilorId")
        addUserId = request.form.get("addUserId")
        filename = secure_filename(file.filename)
        bulkStudent = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
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


class bookCounseling(Resource):
    def post(self):
        data = request.get_json(force=True)
        firstName = data['firstName']
        lastName = data['lastName']
        countryCode = data['countryCode']
        phone = data['phone']
        email = data['email']
        nationality = data['nationality']
        hearAbout = data['hearAbout']
        year = data['year']
        officeId = data['officeId']
        utmSource = data['utmSource']
        utmMedium = data['utmMedium']
        utmCampaign = data['utmCampaign']
        studyAbroadDestination = data["studyAbroadDestination"]
        addStudMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()

        try:
            sqlCheckEmailExist = """select COUNT(*) from students where email=%s"""
            value = (email,)
            cursor.execute(sqlCheckEmailExist, value)
            row_count = cursor.fetchone()[0]
            last_insert_id = ""
            if (row_count == 0):
                sqlStudentAdd = """insert into students(office_id, first_name, last_name, country_code, mobile_no, email, 
                                lead_source, nationality, status, study_abroad_destination, year, utm_source, utm_medium, 
                                utm_campaign, hear_about)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                valStudAdd = (
                officeId, firstName, lastName, countryCode, phone, email, "Counselling booking", nationality,
                "Lead", studyAbroadDestination, year, utmSource, utmMedium, utmCampaign, hearAbout,)
                cursor.execute(sqlStudentAdd, valStudAdd)
                last_insert_id = cursor.lastrowid
                addStudMsg.append("Sucessfully Added the Counseling Student")
            else:
                sqlUpdateStud = """update students set office_id=%s, first_name=%s, last_name=%s,country_code=%s, mobile_no=%s,
                                   lead_source=%s, nationality=%s, status=%s, study_abroad_destination=%s, year=%s, utm_source=%s, 
                                    utm_medium=%s, utm_campaign=%s, hear_about=%s where email=%s"""
                value = (officeId, firstName, lastName, countryCode, phone, "Counselling booking", nationality, "Lead",
                         studyAbroadDestination, year, utmSource, utmMedium, utmCampaign, hearAbout, email,)
                cursor.execute(sqlUpdateStud, value)

                sqlGetStudentId = """select student_id from students where email=%s"""
                value = (email,)
                cursor.execute(sqlGetStudentId, value)
                last_insert_id = cursor.fetchone()[0]
                addStudMsg.append("Sucessfully Added the Counseling Student")
            sqlAddNote = """insert into notes(student_id, counsilor_id, note, contact_type, lead_source)
                            values (%s, %s, %s, %s, %s)"""
            value = (last_insert_id, "0", "Lead added via Counselling booking", "Website", "Counselling booking")
            cursor.execute(sqlAddNote, value)

            sqlGetManager = """select name, username from users where office_id=%s and role=%s AND username != 'rajindersingh@uan-networks.com'"""
            value = (officeId, "manager",)
            cursor.execute(sqlGetManager, value)
            managerDetails = cursor.fetchall()
            if (managerDetails):
                for managerDetail in managerDetails:
                    managerName = managerDetail[0]
                    managerMail = managerDetail[1]
                    htmlContent = f"<p>Hi {managerName},</p><p>A new student has booked a counselling session. Please check their details.</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {last_insert_id}" \
                                  f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                                  f"<p>Thanks<br>UAN Team</p>"
                    sendMail('Registration form Student Added', htmlContent, managerMail)

            if nationality == "nepalese":
                htmlContent = f"<p>Hi Admin,</p><p>A new student has booked a counselling session. Please check their details.</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {last_insert_id}" \
                              f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                              f"<p>Thanks<br>UAN Team</p>"
                sendMail('Registration form Student Added', htmlContent, "uandocuments7@gmail.com")
            elif nationality == "indian":
                htmlContent = f"<p>Hi Admin,</p><p>A new student has booked a counselling session. Please check their details.</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {last_insert_id}" \
                              f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                              f"<p>Thanks<br>UAN Team</p>"
                sendMail('Registration form Student Added', htmlContent, "mansi.s@uninetworks.co.uk")

            htmlContent = f"<p>Hi Admin,</p><p>A new student has booked a counselling session. Please check their details.</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {last_insert_id}" \
                          f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                          f"<p>Thanks<br>UAN Team</p>"
            sendMail('Registration form Student Added', htmlContent, adminMail)

            htmlContent = f"<p>Hi {firstName} {lastName},</p><p>Thank you for booking a counseling session with UAN Networks. Our team will get in touch with you soon.</p>" \
                          f"<p>Thanks<br>UAN Networks Team</p>"
            sendMail('Counseling Booking Completed', htmlContent, email)

            addStudMsg.append('Sucessfully Sent Email')

        except mysql.Error as e:
            addStudMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return addStudMsg


class getCountOfDashboard(Resource):
    def post(self):
        data = request.get_json(force=True)
        year = data["year"]
        officeId = data["officeId"]
        userId = data["userId"]
        dashboardCount = [];
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if (officeId == "All" and userId == "All"):
                sqlGetStudCount = """SELECT count(*) FROM students WHERE YEAR(created_date)=%s"""
                value = (year,)
            elif (officeId != "All" and userId == "All"):
                sqlGetStudCount = """SELECT count(*) FROM students WHERE YEAR(created_date)=%s and office_id=%s"""
                value = (year, officeId,)
            else:
                sqlGetStudCount = """SELECT count(*) FROM students WHERE YEAR(created_date)=%s and office_id=%s and 
                                counsilor_id=%s"""
                value = (year, officeId, userId,)
            cursor.execute(sqlGetStudCount, value)
            studentCount = cursor.fetchall()
            if studentCount:
                dashboardCount.append(studentCount)
            else:
                dashboardCount.append('No data found')

            if (officeId == "All" and userId == "All"):
                sqlGetApplicationCount = """select count(*) from application where YEAR(course_start_date)=%s"""
                value = (year,)
            elif (officeId != "All" and userId == "All"):
                sqlGetApplicationCount = """select count(*) from application inner join students on application.student_id=students.student_id 
                                where YEAR(application.course_start_date)=%s and office_id=%s"""
                value = (year, officeId,)
            else:
                sqlGetApplicationCount = """select count(*) from application inner join students on application.student_id=students.student_id 
                where YEAR(application.course_start_date)=%s and office_id=%s and counsilor_id=%s"""
                value = (year, officeId, userId,)
            cursor.execute(sqlGetApplicationCount, value)
            applicationCount = cursor.fetchall()
            if applicationCount:
                dashboardCount.append(applicationCount)
            else:
                dashboardCount.append('No data found')

            if (officeId == "All" and userId == "All"):
                sqlGetFinalChoiceCount = """select count(*) from application where final_choiced=1 and YEAR(course_start_date)=%s"""
                value = (year,)
            elif (officeId != "All" and userId == "All"):
                sqlGetFinalChoiceCount = """select count(*) from application inner join students on application.student_id=students.student_id 
                                where final_choiced=1 and YEAR(application.course_start_date)=%s and office_id=%s"""
                value = (year, officeId,)
            else:
                sqlGetFinalChoiceCount = """select count(*) from application inner join students on application.student_id=students.student_id 
                                where final_choiced=1 and YEAR(application.course_start_date)=%s and office_id=%s and counsilor_id=%s"""
                value = (year, officeId, userId,)
            cursor.execute(sqlGetFinalChoiceCount, value)
            finalChoiceCount = cursor.fetchall()
            if finalChoiceCount:
                dashboardCount.append(finalChoiceCount)
            else:
                dashboardCount.append('No data found')

            if (officeId == "All"):
                sqlGetUnAssignedLeadsCount = """select count(*) from students where counsilor_id is null and YEAR(created_date)=%s"""
                value = (year,)
            elif (officeId != "All" and userId == "All"):
                sqlGetUnAssignedLeadsCount = """select count(*) from students where counsilor_id is null and YEAR(created_date)=%s and office_id=%s"""
                value = (year, officeId,)
            else:
                sqlGetUnAssignedLeadsCount = """select count(*) from students where counsilor_id is null and YEAR(created_date)=%s and office_id=%s and counsilor_id=%s"""
                value = (year, officeId, userId,)
            cursor.execute(sqlGetUnAssignedLeadsCount, value)
            unAssignedLeadsCount = cursor.fetchall()
            if unAssignedLeadsCount:
                dashboardCount.append(unAssignedLeadsCount)
            else:
                dashboardCount.append('No data found')
        except mysql.Error as e:
            dashboardCount.append(str(e))
        finally:
            cursor.close()

        return dashboardCount


class getUnAssignedAllStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        year = data.get("year", '')
        studentDetails = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectStud = """SELECT student_id, students.office_id, office_name, first_name, 
                            last_name, students.created_date, students.study_abroad_destination FROM students 
                            INNER JOIN offices ON students.office_id = offices.office_id 
                            WHERE counsilor_id IS NULL"""
            values = ()

            if year:
                sqlSelectStud += " AND YEAR(students.created_date) = %s"
                values = (year,)
            cursor.execute(sqlSelectStud, values)
            students_data = cursor.fetchall()
            if students_data:
                studentDetails = json.dumps(students_data, default=str)
            else:
                studentDetails.append('No data found')
        except mysql.Error as e:
            studentDetails.append(str(e))
        finally:
            cursor.close()

        return studentDetails


class getassignedAllStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        year = data.get("year", '')
        studentDetails = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectStud = """select student_id, students.office_id, counsilor_id, office_name, first_name, last_name, 
                            students.created_date, name, students.study_abroad_destination  from students 
                            inner join offices on students.office_id=offices.office_id 
                            inner join users on students.counsilor_id=users.user_id 
                            WHERE counsilor_id is not null and students.status=%s"""
            values = ("Lead",)
            if year:
                sqlSelectStud += " AND YEAR(students.created_date) = %s"
                values += (year,)
            cursor.execute(sqlSelectStud, values)
            students_data = cursor.fetchall()
            if students_data:
                studentDetails = json.dumps(students_data, default=str)
            else:
                studentDetails.append('No data found')
        except mysql.Error as e:
            studentDetails.append(str(e))
        finally:
            cursor.close()

        return studentDetails


class getUnassignedStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        year = data.get("year", '')
        officeIds = officeId.split(",")
        unAssignedStudents = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectStud = """select student_id, students.office_id, office_name, first_name, last_name, students.created_date, students.study_abroad_destination
                            from students inner join offices on students.office_id=offices.office_id 
                            WHERE students.office_id in (%s) and counsilor_id is null"""
            placeholders = ', '.join(['%s'] * len(officeIds))
            sql = sqlSelectStud % placeholders
            cursor.execute(sql, officeIds)
            students_data = cursor.fetchall()
            if students_data:
                unAssignedStudents = json.dumps(students_data, default=str)
            else:
                unAssignedStudents.append('No data found')
        except mysql.Error as e:
            unAssignedStudents.append(str(e))
        finally:
            cursor.close()
        return unAssignedStudents


class getAssignedStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        officeIds = officeId.split(",")
        unAssignedStudents = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectStud = """select student_id, students.office_id, counsilor_id, office_name, first_name, last_name, 
                            students.created_date, name, students.study_abroad_destination from students inner join offices on students.office_id=offices.office_id 
                            inner join users on students.counsilor_id=users.user_id 
                            WHERE students.office_id in (%s) and counsilor_id is not null and students.status='Lead'"""
            placeholders = ', '.join(['%s'] * len(officeIds))
            sql = sqlSelectStud % placeholders
            cursor.execute(sql, officeIds)
            students_data = cursor.fetchall()
            if students_data:
                unAssignedStudents = json.dumps(students_data, default=str)
            else:
                unAssignedStudents.append('No data found')
        except mysql.Error as e:
            unAssignedStudents.append(str(e))
        finally:
            cursor.close()
        return unAssignedStudents


class updateCounsilor(Resource):
    def post(self):
        data = request.get_json(force=True)
        counsilorId = data["counsilorId"];
        studentId = data["studentId"]

        updateMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlupdateCounsilor = """update students set counsilor_id=%s where student_id=%s"""
            value = (counsilorId, studentId,)
            cursor.execute(sqlupdateCounsilor, value)
            updateMsg.append("Counsilor updated")

            sqlGetStudent = """select first_name, last_name from students where student_id=%s"""
            value = (studentId,)
            cursor.execute(sqlGetStudent, value)
            studentDetail = cursor.fetchone()
            firstName = studentDetail[0]
            lastName = studentDetail[1]

            sqlGetCounselorName = """select name, username from users where user_id=%s"""
            value = (counsilorId,)
            cursor.execute(sqlGetCounselorName, value)
            counselorDetail = cursor.fetchone()
            counselorName = counselorDetail[0]
            counselorMail = counselorDetail[1]

            htmlContent = f"<p>Hi {counselorName},</p><p>You have been assigned a new student</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {studentId}</p>" \
                          f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
            sendMail('New Student Assigned', htmlContent, counselorMail)
            updateMsg.append('Sucessfully Sent Email')
        except mysql.Error as e:
            updateMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()
        return updateMsg


class getAllStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        userId = data["userId"]
        studentDetails = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if (officeId == "All" and userId == "All"):
                sqlSelectStud = """select student_id, first_name, last_name, students.email, mobile_no, dob, name from students 
                                left outer join users on students.counsilor_id=users.user_id"""
                value = ()
            elif (officeId != "All" and userId == "All"):
                sqlSelectStud = """select student_id, first_name, last_name, students.email, mobile_no, dob, name from students 
                                left outer join users on students.counsilor_id=users.user_id where students.office_id=%s"""
                value = (officeId,)
            else:
                sqlSelectStud = """select student_id, first_name, last_name, students.email, mobile_no, dob, name from students 
                            left outer join users on students.counsilor_id=users.user_id where students.office_id=%s and counsilor_id=%s"""
                value = (officeId, userId,)
            cursor.execute(sqlSelectStud, value)
            students_data = cursor.fetchall()
            if students_data:
                studentDetails = json.dumps(students_data, default=str)
            else:
                studentDetails.append('No data found')
        except mysql.Error as e:
            studentDetails.append(str(e))
        finally:
            cursor.close()

        return studentDetails


class searchStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        studentId = data["studentId"]
        studentDetails = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectStud = """SELECT * FROM students WHERE student_id=%s"""
            value = (studentId,)
            cursor.execute(sqlSelectStud, value)
            students_data = cursor.fetchall()
            if students_data:
                studentDetails = json.dumps(students_data, default=str)
            else:
                studentDetails.append('No data found')
        except mysql.Error as e:
            studentDetails.append(str(e))
        finally:
            cursor.close()

        return studentDetails


class personalUpdate(Resource):
    def post(self):
        data = request.get_json(force=True)
        studentId = data["studentId"]
        firstName = data["firstName"]
        lastName = data["lastName"]
        countryCode = data["countryCode"]
        phone = data["phone"]
        gender = data["gender"]
        email = data["email"]
        euStatus = data["euStatus"]
        dob = data["dob"]
        nationality = data["nationality"]
        birthCountry = data["birthCountry"]
        enquiryAbout = data["enquiryAbout"]
        studyAbroadDestination = data["studyAbroadDestination"]
        yearIntake = data["year"]
        hearAbout = data["hearAbout"]
        updated_by = data["updated_by"]

        personalUpdateMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()

        try:
            sqlUpdateStud = """update students set first_name=%s, last_name=%s, country_code=%s, mobile_no=%s, email=%s, gender=%s, eu_status=%s,
                            dob=%s, nationality=%s, birth_country=%s, enquiry_about=%s, study_abroad_destination=%s, year=%s, hear_About=%s, updated_by=%s where student_id=%s"""
            value = (firstName, lastName, countryCode, phone, email, gender, euStatus, dob, nationality, birthCountry,
                     enquiryAbout, studyAbroadDestination, yearIntake, hearAbout, updated_by, studentId,)
            cursor.execute(sqlUpdateStud, value)
            personalUpdateMsg.append("Personal data updated")
        except mysql.Error as e:
            personalUpdateMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return personalUpdateMsg


class statusUpdate(Resource):
    def post(self):
        data = request.get_json(force=True)
        studentId = data["studentId"]
        status = data["status"]
        # subStatus = data["subStatus"]
        office = data["office"]
        consultant = data["consultant"]
        marketingSource = data["marketingSource"]
        partner = data["partner"]
        # firstName = data["firstName"]
        # lastName = data["lastName"]
        # phone = data["phone"]
        # email = data["email"]
        # nationality = data["nationality"]
        updated_by = data["updated_by"]
        refferalId = data["refferalId"]

        addStudMsg = []
        statusUpdateMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlUpdateStud = """update students set status=%s, office_id=%s, counsilor_id=%s, lead_source=%s, partner_id=%s, updated_by=%s, refferal_id=%s
                            where student_id=%s"""
            value = (status, office, consultant, marketingSource, partner, updated_by, refferalId, studentId,)
            cursor.execute(sqlUpdateStud, value)
            sqlUpdateApplication = """update application set partner=%s
                                        where student_id=%s"""
            valueApplication = (partner, studentId,)
            cursor.execute(sqlUpdateApplication, valueApplication)
            statusUpdateMsg.append("Status updated")
        except mysql.Error as e:
            statusUpdateMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return statusUpdateMsg


class addStudentNotes(Resource):
    def post(self):
        data = request.get_json(force=True)
        studentId = data["studentId"]
        userId = data["userId"]
        note = data["note"]
        reminderDate = data["reminderDate"]
        contactType = data["contactType"]
        leadSource = data["leadSource"]
        if (reminderDate == ""):
            status = 0;
        else:
            status = 1
        addNoteMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlAddNote = """insert into notes(student_id, counsilor_id, note, reminder_date, contact_type, lead_source, status)
                            values (%s, %s, %s, %s, %s, %s, %s)"""
            value = (studentId, userId, note, reminderDate, contactType, leadSource, status,)
            cursor.execute(sqlAddNote, value)
            addNoteMsg.append("Sucessfully Added the Notes")

        except mysql.Error as e:
            addNoteMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return addNoteMsg


class getStudentNotes(Resource):
    def post(self):
        data = request.get_json(force=True)
        student_id = data["studentId"]
        studentNotes = []

        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectStud = """SELECT name, note, contact_type, lead_source, notes.created_date, notes.status, reminder_date, note_id FROM notes 
                            left outer join users on users.user_id=notes.counsilor_id WHERE student_id=%s order by note_id desc"""
            value = (student_id,)
            cursor.execute(sqlSelectStud, value)
            students_data = cursor.fetchall()
            if students_data:
                studentNotes = json.dumps(students_data, default=str)
            else:
                studentNotes.append('No data found')
        except mysql.Error as e:
            studentNotes.append(str(e))
        finally:
            cursor.close()

        return studentNotes


class addNewApplication(Resource):
    def post(self):
        data = request.get_json(force=True)
        studentId = data["studentId"]
        courseType = data["courseType"]
        institutionName = data["institutionName"]
        institutionId = data["institutionId"]
        courseStartDate = data["courseStartDate"]
        courseEndDate = data["courseEndDate"]
        courseName = data["courseName"]
        dateOfApplicationSent = data["dateOfApplicationSent"]
        partner = data["partner"]
        tutionFeeCurrency = data["tutionFeeCurrency"]
        tutionFee = data["tutionFee"]
        loginUrl = data["loginUrl"]
        username = data["username"]
        password = data["password"]
        applicationMethod = data["applicationMethod"]
        counsellingType = data["counsellingType"]
        ielts = data["ielts"]
        franchise = data["franchise"]

        insertMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlAddApplication = """insert into application(student_id, course_type, institution_name, course_start_date, course_end_date,
                                course_name, date_of_application_sent, partner,tutionfee_currency, tution_fee, login_url, username, password, application_method,
                                counselling_type, ielts, institution_id, franchise) Values 
                                (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            value = (
            studentId, courseType, institutionName, courseStartDate, courseEndDate, courseName, dateOfApplicationSent,
            partner, tutionFeeCurrency, tutionFee, loginUrl, username, password, applicationMethod, counsellingType,
            ielts, institutionId, franchise)
            cursor.execute(sqlAddApplication, value)

            sqlUpdateStud = """update students set status=%s where student_id=%s"""
            value = ("Active", studentId,)
            cursor.execute(sqlUpdateStud, value)
            insertMsg.append("Application added")
        except mysql.Error as e:
            insertMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()
        return insertMsg


class getApplicationData(Resource):
    def post(self):
        data = request.get_json(force=True)
        studentId = data["studentId"]

        applicationData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetApplication = """select * from application where student_id=%s"""
            value = (studentId,)
            cursor.execute(sqlGetApplication, value)
            application_data = cursor.fetchall()
            if application_data:
                applicationData = json.dumps(application_data, default=str)
            else:
                applicationData.append('No data found')
        except mysql.Error as e:
            applicationData.append(str(e))
        finally:
            cursor.close()

        return applicationData


class offerFileUpload(Resource):
    def post(self):
        file = request.files['file']
        filename = secure_filename(file.filename)
        uploadFile = []
        try:
            file.save(os.path.join(UPLOAD_FOLDER, filename))
            uploadFile.append('File uploaded Successfully\n')
        except OSError as e:
            uploadFile.append(str(e))

        return [uploadFile]


class getOfferFile(Resource):
    def post(self):
        data = request.get_json(force=True)
        fileName = data["fileName"]
        fileType = ""
        try:
            base64_files = []  # Initialize a list to store the Base64-encoded images
            file_path = os.path.join(UPLOAD_FOLDER, fileName)

            # Check if the file exists
            image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tif', '.tiff'}
            if os.path.exists(file_path) and os.path.splitext(file_path)[1].lower() in image_extensions:
                with open(file_path, 'rb') as image_file:
                    image_contents = image_file.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_image = base64.b64encode(image_contents).decode('utf-8')
                    base64_files.append(base64_image)
                fileType = "image"
            elif os.path.exists(file_path) and os.path.splitext(file_path)[1].lower() == '.pdf':
                # Open and read the file
                with open(file_path, 'rb') as file_to_read:
                    file_contents = file_to_read.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_pdf = base64.b64encode(file_contents).decode('utf-8')
                    base64_files.append(base64_pdf)
                fileType = "pdf"
            elif os.path.exists(file_path) and (os.path.splitext(file_path)[1].lower() == '.xlsx'
                                                or os.path.splitext(file_path)[1].lower() == '.xls'):
                # Open and read the Excel file
                with open(file_path, 'rb') as excel_file:
                    excel_contents = excel_file.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_excel = base64.b64encode(excel_contents).decode('utf-8')
                    base64_files.append(base64_excel)
                fileType = "xl"
            elif os.path.exists(file_path) and os.path.splitext(file_path)[1].lower() == '.csv':
                # Open and read the CSV file
                with open(file_path, 'rb') as csv_file:
                    csv_contents = csv_file.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_csv = base64.b64encode(csv_contents).decode('utf-8')
                    base64_files.append(base64_csv)
                fileType = "csv"
            else:
                base64_files.append('')
                fileType = ""
        except mysql.Error as e:
            staffDet.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return [base64_files, fileType]


class applicationUpdate(Resource):
    def post(self):
        data = request.get_json(force=True)
        applicationId = data["applicationId"]
        university = data["universityEdit"]
        institutionId = data["institutionId"]
        coursename = data["coursenameEdit"]
        coursetype = data["coursetypeEdit"]
        partner = data["partner"]
        tutionFeeCurrency = data["tutionFeeCurrency"]
        tutionFee = data["tutionFee"]
        loginurl = data["loginurlEdit"]
        username = data["usernameEdit"]
        password = data["passwordEdit"]
        applicationMethod = data["applicationMethod"]
        counsellingType = data["counsellingType"]
        courseStartDate = data["courseStartDateEdit"]
        courseEndDate = data["courseEndDateEdit"]
        applicationSentDate = data["applicationSentDateEdit"]
        offerCreationDate = data["offerCreationDateEdit"]
        offerDecisionType = data["offerDecisionTypeEdit"]
        referenceNo = data["referenceNoEdit"]
        depositCurrency = data["depositCurrency"]
        depositAmount = data["depositAmount"]
        depositIsNotRequired = data["depositIsNotRequired"]
        depositPaidDate = data["depositPaidDate"]
        visaAppliedDate = data["visaAppliedDate"]
        visaDecisionType = data["visaDecisionType"]
        visaDecisionDate = data["visaDecisionDate"]
        casIssued = data["casIssued"]
        ielts = data["ielts"]
        offerFileUpload = data["offerFileUpload"]

        updateApplication = []

        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlUpdateApplication = """update application set institution_name=%s, course_name=%s, course_type=%s, login_url=%s,
                                    username=%s, password=%s, course_start_date=%s, course_end_date=%s, date_of_application_sent=%s,
                                    partner=%s, offer_creation_date=%s, offer_decision_type=%s, reference_no=%s, deposit_currency=%s,
                                    deposit_amount=%s, tutionfee_currency=%s, tution_fee=%s, application_method=%s,counselling_type=%s,
                                    deposit_is_not_required=%s, deposit_paid_date=%s, cas_issued=%s, visa_applied_date=%s, 
                                    visa_decision=%s, visa_decision_date=%s, ielts=%s, file_url=%s, institution_id=%s
                                    where application_id=%s"""
            value = (university, coursename, coursetype, loginurl, username, password, courseStartDate, courseEndDate,
                     applicationSentDate,
                     partner, offerCreationDate, offerDecisionType, referenceNo, depositCurrency, depositAmount,
                     tutionFeeCurrency,
                     tutionFee, applicationMethod, counsellingType, depositIsNotRequired,
                     depositPaidDate, casIssued, visaAppliedDate, visaDecisionType, visaDecisionDate, ielts,
                     offerFileUpload, institutionId, applicationId)
            cursor.execute(sqlUpdateApplication, value)
            updateApplication.append("Application Updated")
        except mysql.Error as e:
            updateApplication.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return updateApplication


class checkItsFinalChoice(Resource):
    def post(self):
        data = request.get_json(force=True)
        applicationId = data["applicationId"]
        finalChoiceApplication = []

        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetFinalChoiceApplication = "select count(*) from application where application_id=%s and final_choiced=1"
            value = (applicationId,)
            cursor.execute(sqlGetFinalChoiceApplication, value)
            applicationCount = cursor.fetchall()
            if applicationCount:
                finalChoiceApplication.append(applicationCount)
            else:
                finalChoiceApplication.append('No data found')
        except mysql.Error as e:
            finalChoiceApplication.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return finalChoiceApplication


class deleteApplication(Resource):
    def post(self):
        data = request.get_json(force=True)
        applicationId = data["applicationId"]
        deleteApplication = []

        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlUpdateApplication = "delete from application where application_id=%s"
            value = (applicationId,)
            cursor.execute(sqlUpdateApplication, value)
            deleteApplication.append("Application Deleted")
        except mysql.Error as e:
            deleteApplication.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return deleteApplication


class getStudentFinalChoicedCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        studentId = data["studentId"]
        studentFinalChoiceCount = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlAddFinalChoice = "select COUNT(*) from application where student_id=%s and final_choiced=%s"
            cursor.execute(sqlAddFinalChoice, (studentId, 1,))
            finalChoiceCount = cursor.fetchall()
            if finalChoiceCount:
                studentFinalChoiceCount = finalChoiceCount
            else:
                studentFinalChoiceCount.append('No data found')
        except mysql.Error as e:
            studentFinalChoiceCount.append(str(e))
        finally:
            cursor.close()

        return studentFinalChoiceCount


class addFinalChoice(Resource):
    def post(self):
        data = request.get_json(force=True)
        applicationId = data["applicationId"]
        addFinalChoiceData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlAddFinalChoice = "update application set final_choiced=%s where application_id=%s"
            cursor.execute(sqlAddFinalChoice, (1, applicationId))
            addFinalChoiceData.append("Final choice added")
        except mysql.Error as e:
            addFinalChoiceData.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return addFinalChoiceData


class removeFinalChoice(Resource):
    def post(self):
        data = request.get_json(force=True)
        applicationId = data["applicationId"]
        removeFinalChoiceData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlRemoveFinalChoice = "update application set final_choiced=%s where application_id=%s"
            cursor.execute(sqlRemoveFinalChoice, (0, applicationId))
            removeFinalChoiceData.append("Final choice Removed")
        except mysql.Error as e:
            removeFinalChoiceData.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return removeFinalChoiceData


class getFinalChoicedData(Resource):
    def post(self):
        data = request.get_json(force=True)
        studentId = data["studentId"]

        finalChoiceData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlAddApplication = """select * from application where student_id=%s AND final_choiced=%s"""
            value = (studentId, 1)
            cursor.execute(sqlAddApplication, value)
            finalchoice_data = cursor.fetchall()
            if finalchoice_data:
                finalChoiceData = json.dumps(finalchoice_data, default=str)
            else:
                finalChoiceData.append('No data found')
        except mysql.Error as e:
            finalChoiceData.append(str(e))
        finally:
            cursor.close()

        return finalChoiceData


class editApplication(Resource):
    def post(self):
        data = request.get_json(force=True)
        applicationId = data["applicationId"]

        applicationData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlAddApplication = """select application_id,student_id,course_type,institution_name,course_start_date,course_end_date,
                course_name,date_of_application_sent,partner,tution_fee,login_url,username,application.password,application_method,counselling_type,
                ielts,final_choiced,file_url,offer_creation_date,offer_decision_type,reference_no,deposit_amount,deposit_is_not_required,deposit_paid_date,
                cas_issued,visa_applied_date,visa_decision,visa_decision_date,application.created_date,tutionfee_currency,deposit_currency,institution_id,invoiceNo,
                invoiceSent,paidToUs,director_first_name,director_last_name
                from application LEFT JOIN partners ON application.partner=partners.partner_id where application_id=%s"""
            value = (applicationId,)
            cursor.execute(sqlAddApplication, value)
            application_data = cursor.fetchall()
            if application_data:
                applicationData = json.dumps(application_data, default=str)
            else:
                applicationData.append('No data found')
        except mysql.Error as e:
            applicationData.append(str(e))
        finally:
            cursor.close()

        return applicationData


class deleteStudent(Resource):
    def post(self):
        data = request.get_json(force=True)
        studentId = data["studentId"]

        deletePersonResult = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqldeleteStudent = """delete from students where student_id=%s"""
            value = (studentId,)
            cursor.execute(sqldeleteStudent, value)
            sqlDeleteApplication = "delete from application where student_id=%s"
            value = (studentId,)
            cursor.execute(sqlDeleteApplication, value)
            sqlDeleteNotes = "delete from notes where student_id=%s"
            value = (studentId,)
            cursor.execute(sqlDeleteNotes, value)
            deletePersonResult.append('Succesfully deleted')
        except mysql.Error as e:
            deletePersonResult.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return deletePersonResult


class getUsers(Resource):
    def get(self):
        users = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectUsers = """select user_id, name, office_name, role, username,password_str, users.created_date, 
                                count(students.counsilor_id) as studentsCount, users.deactivate, users.email from users 
                                inner join offices on users.office_id=offices.office_id 
                                left outer join students on users.user_id=students.counsilor_id 
                                WHERE users.role != 'partner'
                                group by students.counsilor_id, users.name, users.user_id, offices.office_name, users.role, 
                                users.username, users.password_str, users.created_date"""
            cursor.execute(sqlSelectUsers)
            users_data = cursor.fetchall()
            if users_data:
                users = json.dumps(users_data, default=str)
            else:
                users.append('No data found')
        except mysql.Error as e:
            users.append(str(e))
        finally:
            cursor.close()

        return users


class searchUser(Resource):
    def post(self):
        data = request.get_json(force=True)
        userId = data["userId"]

        userList = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetUsers = """select user_id, name, office_name, role, username,password_str, users.created_date, users.email from users
                            inner join offices on users.office_id=offices.office_id where user_id=%s"""
            value = (userId,)
            cursor.execute(sqlGetUsers, value)
            user_data = cursor.fetchall()
            sqlGetUserCount = """select count(*) from students where counsilor_id=%s"""
            value = (userId,)
            cursor.execute(sqlGetUserCount, value)
            userCount = cursor.fetchall()
            if user_data:
                user_data.append(userCount)
                userList = json.dumps(user_data, default=str)
            else:
                userList.append('No data found')
        except mysql.Error as e:
            userList.append(str(e))
        finally:
            cursor.close()

        return userList


class addUser(Resource):
    def post(self):
        data = request.get_json(force=True)
        name = data["name"]
        office = data["office"]
        role = data["role"]
        email = data["email"]
        passwordStr = data["password"]
        partnerId = data["partnerId"]
        franchiseId = data["franchiseId"]

        userAdd = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            password_key = Fernet.generate_key()
            fernet = Fernet(password_key)
            password = fernet.encrypt(passwordStr.encode())
            sqlAddUser = """insert into users(name, office_id, username, password, password_str, role, password_key, email, partners_id, franchise_id) 
                        values
                        (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            value = (name, office, email, password, passwordStr, role, password_key, email, partnerId, franchiseId)
            cursor.execute(sqlAddUser, value)
            last_insert_id = cursor.lastrowid
            if role == "manager":
                sqlGetOfficeManagerIds = "select manager_id from offices where office_id=%s"
                value = (office,)
                cursor.execute(sqlGetOfficeManagerIds, value)
                managerIds = cursor.fetchone()
                managerOfficeIds = ""
                if managerIds[0] not in "":
                    managerIdsArray = managerIds[0].split(",")
                    managerIdsArray.append(last_insert_id)
                    managerOfficeIds = ','.join(str(item) for item in managerIdsArray)
                else:
                    managerOfficeIds = last_insert_id

                sqlUpdateOffice = """update offices set manager_id=%s where office_id=%s"""
                value = (managerOfficeIds, office,)
                cursor.execute(sqlUpdateOffice, value)

            userAdd.append('User added')
        except mysql.Error as e:
            userAdd.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return userAdd


class updateUser(Resource):
    def post(self):
        data = request.get_json(force=True)
        userId = data["userId"]
        name = data["name"]
        office = data["office"]
        role = data["role"]
        email = data["email"]
        passwordStr = data["password"]

        userUpdate = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetOldOffice = "select office_id from users where user_id=%s"
            value = (userId,)
            cursor.execute(sqlGetOldOffice, value)
            oldOfficeId = cursor.fetchone()[0]

            password_key = Fernet.generate_key()
            fernet = Fernet(password_key)
            password = fernet.encrypt(passwordStr.encode())
            if role == 'admin':
                sqlUpdateUser = """update users set name=%s, office_id=%s, password=%s, 
                                    password_str=%s, role=%s, password_key=%s, email=%s where user_id=%s"""
                value = (name, office, password, passwordStr, role, password_key, email, userId,)
            else:
                sqlUpdateUser = """update users set name=%s, office_id=%s, username=%s, password=%s, 
                                                password_str=%s, role=%s, password_key=%s, email=%s where user_id=%s"""
                value = (name, office, email, password, passwordStr, role, password_key, email, userId,)
            cursor.execute(sqlUpdateUser, value)

            if oldOfficeId != office:
                sqlGetOfficeManagerIds = "select manager_id from offices where office_id=%s"
                value = (oldOfficeId,)
                cursor.execute(sqlGetOfficeManagerIds, value)
                managerIds = cursor.fetchone()
                if managerIds[0] not in "":
                    managerIdsArray = managerIds[0].split(",")
                    if str(userId) in managerIdsArray:
                        index = managerIdsArray.index(str(userId))
                        managerIdsArray.pop(index)
                        managerOfficeIds = ','.join(str(item) for item in managerIdsArray)
                        sqlUpdateOffice = """update offices set manager_id=%s where office_id=%s"""
                        value = (managerOfficeIds, oldOfficeId,)
                        cursor.execute(sqlUpdateOffice, value)

            sqlGetOfficeManagerIds = "select manager_id from offices where office_id=%s"
            value = (office,)
            cursor.execute(sqlGetOfficeManagerIds, value)
            managerIds = cursor.fetchone()
            managerOfficeIds = ""

            if role == "manager":
                if managerIds[0] not in "":
                    managerIdsArray = managerIds[0].split(",")
                    if str(userId) not in managerIdsArray:
                        managerIdsArray.append(userId)
                    managerOfficeIds = ','.join(str(item) for item in managerIdsArray)
                else:
                    managerOfficeIds = userId
            else:
                if managerIds[0] not in "":
                    managerIdsArray = managerIds[0].split(",")
                    if str(userId) in managerIdsArray:
                        index = managerIdsArray.index(str(userId))
                        managerIdsArray.pop(index)
                    managerOfficeIds = ','.join(str(item) for item in managerIdsArray)
                else:
                    managerOfficeIds = ""
            sqlUpdateOffice = """update offices set manager_id=%s where office_id=%s"""
            value = (managerOfficeIds, office,)
            cursor.execute(sqlUpdateOffice, value)

            userUpdate.append('User Updated')
        except mysql.Error as e:
            userUpdate.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return userUpdate


class deleteUser(Resource):
    def post(self):
        data = request.get_json(force=True)
        userId = data["userId"]

        userDelete = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlDeleteUser = """update users set deactivate=%s where user_id=%s"""
            value = (1, userId,)
            cursor.execute(sqlDeleteUser, value)
            userDelete.append('Staff Deactivated')
        except mysql.Error as e:
            userDelete.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return userDelete


class searchOffice(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]

        officeList = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetOffice = """select * from offices where office_id=%s"""
            value = (officeId,)
            cursor.execute(sqlGetOffice, value)
            office_data = cursor.fetchall()
            sqlGetUserCount = """select count(*) from users where office_id=%s"""
            value = (officeId,)
            cursor.execute(sqlGetUserCount, value)
            userCount = cursor.fetchall()
            if office_data:
                office_data.append(userCount)
                officeList = json.dumps(office_data, default=str)
            else:
                officeList.append('No data found')
        except mysql.Error as e:
            officeList.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return officeList


class getManagers(Resource):
    def get(self):
        managersList = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetManager = """select user_id,name from users where role=%s and deactivate=%s"""
            value = ("manager", 0,)
            cursor.execute(sqlGetManager, value)
            managers_data = cursor.fetchall()
            if managers_data:
                managersList = json.dumps(managers_data, default=str)
            else:
                managersList.append('No data found')
        except mysql.Error as e:
            managersList.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return managersList


class getOfficeWithManager(Resource):
    def get(self):
        officesManager = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetOffices = """SELECT o.office_id, o.office_name, o.manager_id, o.created_date, COALESCE(u.userCount, 0) AS userCount, 
                            COALESCE(s.studentCount, 0) AS studentCount, o.deactivate
                            FROM offices o
                            LEFT JOIN (SELECT office_id, COUNT(DISTINCT user_id) AS userCount FROM users 
                            GROUP BY office_id) u ON o.office_id = u.office_id
                            LEFT JOIN (SELECT office_id, COUNT(DISTINCT student_id) AS studentCount FROM students 
                            GROUP BY office_id) s ON o.office_id = s.office_id;
                            """
            cursor.execute(sqlGetOffices)
            offices_data = cursor.fetchall()
            if offices_data:
                for office_data in offices_data:
                    officeId = office_data[0]
                    officeName = office_data[1]
                    managerIds = office_data[2]
                    createdDate = office_data[3]
                    userCount = office_data[4]
                    studentCount = office_data[5]
                    deactivate = office_data[6]

                    managers = ""

                    if managerIds and managerIds.strip():
                        managerIdList = tuple(managerIds.split(","))
                        sqlGetManager = "SELECT name FROM users WHERE user_id IN ({}) AND deactivate=0".format(
                            ", ".join(["%s"] * len(managerIdList))
                        )
                        cursor.execute(sqlGetManager, managerIdList)
                        managers = ', '.join([str(row[0]) for row in cursor.fetchall()])

                    officesManager.append({
                        'officeId': officeId,
                        'officeName': officeName,
                        'managers': managers,
                        'createdDate': createdDate,
                        'userCount': userCount,
                        'studentCount': studentCount,
                        'deactivate': deactivate
                    })

                officesManager = json.dumps(officesManager, default=str)
            else:
                officesManager.append('No data found')
        except mysql.Error as e:
            officesManager.append(str(e))
        finally:
            cnx.commit()
            cursor.close()
            cnx.close()

        return officesManager


class updateOffice(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        officeName = data["office"]
        manager = data["manager"]

        officeList = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlUpdateOffice = """update offices set office_name=%s,manager_id=%s where office_id=%s"""
            value = (officeName, manager, officeId,)
            cursor.execute(sqlUpdateOffice, value)
            officeList.append('Office Updated')
        except mysql.Error as e:
            officeList.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return officeList


class deleteOffice(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]

        officeList = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlDeleteOffice = """update offices set deactivate=%s where office_id=%s"""
            value = (1, officeId,)
            cursor.execute(sqlDeleteOffice, value)
            officeList.append('Office Deactivated')
        except mysql.Error as e:
            officeList.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return officeList


class addOffice(Resource):
    def post(self):
        data = request.get_json(force=True)
        office = data["office"]
        manager = data["manager"]

        officeList = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlAddOffice = """insert into offices (office_name,manager_id) values (%s,%s)"""
            value = (office, manager,)
            cursor.execute(sqlAddOffice, value)
            officeList.append('Office Added')
        except mysql.Error as e:
            officeList.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return officeList


class getCounselors(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["office"]
        counselorList = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetCounselor = """select user_id,name from users where role in ('manager', 'counselor') and deactivate=0 and office_id=%s"""
            value = (officeId,)
            cursor.execute(sqlGetCounselor, value)
            counselors_data = cursor.fetchall()
            if counselors_data:
                counselorList = json.dumps(counselors_data, default=str)
            else:
                counselorList.append('No data found')
        except mysql.Error as e:
            counselorList.append(str(e))
        finally:
            cursor.close()

        return counselorList


class getCounsilorStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        counsilorId = data["counsilorId"]
        students = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetStudents = """select student_id, students.office_id, counsilor_id, office_name, first_name, last_name, 
                            students.created_date, students.status, students.study_abroad_destination from students inner join offices on students.office_id=offices.office_id 
                            WHERE counsilor_id=%s and students.status=%s"""
            value = (counsilorId, "Lead",)
            cursor.execute(sqlGetStudents, value)
            studentsList = cursor.fetchall()
            if studentsList:
                students = json.dumps(studentsList, default=str)
            else:
                students.append('No data found')
        except mysql.Error as e:
            students.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return students


class getManagerCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        managerCount = [];
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetManagerCount = """select count(*) from users where role=%s AND office_id=%s"""
            value = ("manager", officeId,)
            cursor.execute(sqlGetManagerCount, value)
            managerCount = cursor.fetchall()
        except mysql.Error as e:
            managerCount.append(str(e))
        finally:
            cursor.close()

        return managerCount


class getStaffEmailCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        email = data["email"]
        emailCount = [];
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetManagerCount = """select count(*) from users where username=%s or email=%s"""
            value = (email, email,)
            cursor.execute(sqlGetManagerCount, value)
            emailCount = cursor.fetchall()
        except mysql.Error as e:
            emailCount.append(str(e))
        finally:
            cursor.close()

        return emailCount


# phase2 changes
class getSelectedData(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data.get('officeId')
        userId = data.get('userId')
        selectVal = data.get('selectVal', '').capitalize()
        selectedYear = data.get("year")
        selectedData = []

        try:
            cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
            cursor = cnx.cursor()

            base_query = """
                            SELECT DISTINCT s.student_id, s.first_name, s.last_name, s.email, s.mobile_no, s.dob, u.name, o.office_name, 
                            utm_source, sn.note AS last_note, sn.created_date AS last_note_date, s.study_abroad_destination FROM students s 
                            LEFT OUTER JOIN users u ON s.counsilor_id = u.user_id 
                            LEFT OUTER JOIN offices o ON s.office_id = o.office_id 
                            LEFT OUTER JOIN (SELECT student_id, MAX(created_date) AS max_note_date FROM notes GROUP BY student_id) max_notes ON s.student_id = max_notes.student_id 
                            LEFT OUTER JOIN notes sn ON s.student_id = sn.student_id AND max_notes.max_note_date = sn.created_date
                        """

            filters = []
            values = []

            if selectVal == "Unassigned":
                filters.append("s.counsilor_id is Null")
                if officeId != "All":
                    filters.append("s.office_id=%s")
                    values.append(officeId)

            elif selectVal == "Assigned":
                filters.append("s.counsilor_id is not Null")
                filters.append("s.status=%s ")
                values.append("Lead")
                if officeId != "All":
                    filters.append("s.office_id=%s")
                    values.append(officeId)
                if userId != "All":
                    filters.append("s.counsilor_id = %s")
                    values.append(userId)
            elif selectVal == "All":
                if officeId != "All":
                    filters.append("s.office_id=%s ")
                    values.append(officeId)
                if userId != "All":
                    filters.append("s.counsilor_id=%s")
                    values.append(userId)
            else:
                filters.append("s.status = %s")
                values.append(selectVal)
                if officeId != "All":
                    filters.append("s.office_id=%s")
                    values.append(officeId)
                if userId != "All":
                    filters.append("s.counsilor_id=%s")
                    values.append(userId)

            filters.append("YEAR(s.created_date) = %s")
            values.append(selectedYear)

            sqlSelectStud = base_query + " WHERE " + " AND ".join(filters) if filters else base_query

            cursor.execute(sqlSelectStud, values)
            students_data = cursor.fetchall()
            if students_data:
                selectedData = json.dumps(students_data, default=str)
            else:
                selectedData.append('No data found')

        except mysql.Error as e:
            selectedData.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return selectedData


class getApplications(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data['officeId']
        userId = data['userId']
        selectedYear = data['year']

        applicationData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if (officeId == "All" and userId == "All"):
                sqlSelectApp = """select application.student_id, application_id, institution_name, course_name, course_start_date,
                                first_name, last_name, date_of_application_sent, o.office_name from application left join students on 
                                students.student_id=application.student_id LEFT JOIN offices o ON students.office_id = o.office_id where YEAR(application.course_start_date)=%s"""
                value = (selectedYear,)
            elif (officeId != "All" and userId == "All"):
                sqlSelectApp = """select application.student_id, application_id, institution_name, course_name, course_start_date, first_name, 
                            last_name, date_of_application_sent, o.office_name from application left join students on 
                            students.student_id=application.student_id LEFT JOIN offices o ON students.office_id = o.office_id where students.office_id=%s and YEAR(application.course_start_date)=%s"""
                value = (officeId, selectedYear,)
            else:
                sqlSelectApp = """select application.student_id, application_id, institution_name, course_name, course_start_date, first_name, 
                            last_name, date_of_application_sent, o.office_name from application left join students
                            on students.student_id=application.student_id LEFT JOIN offices o ON students.office_id = o.office_id where students.office_id=%s and counsilor_id=%s and YEAR(application.course_start_date)=%s"""
                value = (officeId, userId, selectedYear,)

            cursor.execute(sqlSelectApp, value)
            application_data = cursor.fetchall()
            if application_data:
                applicationData = json.dumps(application_data, default=str)
            else:
                applicationData.append('No data found')

        except mysql.Error as e:
            applicationData.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return applicationData


class getAllFinalChoicedApplication(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data['officeId']
        userId = data['userId']
        selectedYear = data['year']
        finalChoiceApplicationData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if (officeId == "All" and userId == "All"):
                sqlSelectApp = """select application.student_id, application_id, institution_name, course_name, course_start_date,
                                first_name, last_name, date_of_application_sent, o.office_name from application left outer join students on 
                                students.student_id=application.student_id LEFT JOIN offices o ON students.office_id = o.office_id where final_choiced=1 and YEAR(application.course_start_date)=%s"""
                value = (selectedYear,)
            elif (officeId != "All" and userId == "All"):
                sqlSelectApp = """select application.student_id, application_id, institution_name, course_name, course_start_date, first_name, 
                            last_name, date_of_application_sent, o.office_name from application left outer join students on 
                            students.student_id=application.student_id LEFT JOIN offices o ON students.office_id = o.office_id where students.office_id=%s and final_choiced=1 and YEAR(application.course_start_date)=%s"""
                value = (officeId, selectedYear,)
            else:
                sqlSelectApp = """select application.student_id, application_id, institution_name, course_name, course_start_date, first_name, 
                            last_name, date_of_application_sent, o.office_name from application left outer join students on 
                            students.student_id=application.student_id LEFT JOIN offices o ON students.office_id = o.office_id where students.office_id=%s and counsilor_id=%s and 
                            final_choiced=1 and YEAR(application.course_start_date)=%s"""
                value = (officeId, userId, selectedYear,)

            cursor.execute(sqlSelectApp, value)
            finalchoiced_application_data = cursor.fetchall()
            if finalchoiced_application_data:
                finalChoiceApplicationData = json.dumps(finalchoiced_application_data, default=str)
            else:
                finalChoiceApplicationData.append('No data found')

        except mysql.Error as e:
            finalChoiceApplicationData.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return finalChoiceApplicationData


class getUnassignedStudentsYear(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        officeIds = officeId.split(",")
        selectedYear = data['year']
        unAssignedStudents = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if (officeId == "All"):
                sqlSelectStud = """select student_id, students.office_id, office_name, first_name, last_name, students.created_date 
                                from students inner join offices on students.office_id=offices.office_id 
                                WHERE counsilor_id is null and YEAR(students.created_date)=%s"""
                value = (selectedYear,)
                cursor.execute(sqlSelectStud, value)
            else:
                sqlSelectStud = """select student_id, students.office_id, office_name, first_name, last_name, students.created_date 
                            from students inner join offices on students.office_id=offices.office_id 
                            WHERE students.office_id in (%s) and counsilor_id is null and YEAR(students.created_date)=%s"""
                placeholders = ', '.join(['%s'] * len(officeIds))
                sqlSelectStud = sqlSelectStud.format(placeholders)
                cursor.execute(sqlSelectStud, [*officeIds, selectedYear])
            students_data = cursor.fetchall()
            if students_data:
                unAssignedStudents = json.dumps(students_data, default=str)
            else:
                unAssignedStudents.append('No data found')
        except mysql.Error as e:
            unAssignedStudents.append(str(e))
        finally:
            cursor.close()
        return unAssignedStudents


class getApplicationCountYear(Resource):
    def post(self):
        data = request.get_json(force=True)
        selectedYear = data['year']
        officeId = data['officeId']
        applicationCount = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()

        try:
            if (officeId != ""):
                sqlSelectCount = """select count(*) as total_count, count(IF(course_type="Foundation",1,NULL)) as foundation_count, 
                            count(IF(course_type="Undergraduate",1,NULL)) as ug_count,count(IF(course_type="Postgraduate",1,NULL)) as pg_count,
                            count(IF(course_type="Pre-Masters",1,NULL)) as preMast_count,count(IF(course_type="Pre-Sessional",1,NULL)) as preSess_count,
                            count(IF(course_type="Phd",1,NULL)) as phd_count,count(IF(course_type="Summer School",1,NULL)) as summer_school_count,
                            count(IF(course_type="Pathways Follow on",1,NULL)) as pathways_follow_count,count(IF(course_type="Year 2 Follow on",1,NULL)) as Y2_count,
                            count(IF(course_type="Year 3 Follow on",1,NULL)) as Y3_count from application 
                            left outer join students on students.student_id=application.student_id 
                            where YEAR(course_start_date)=%s and office_id=%s"""
                value = (selectedYear, officeId,)

                sqlSelectPreCount = """select count(*) as total_count, count(IF(course_type="Foundation",1,NULL)) as foundation_count, 
                                    count(IF(course_type="Undergraduate",1,NULL)) as ug_count,count(IF(course_type="Postgraduate",1,NULL)) as pg_count,
                                    count(IF(course_type="Pre-Masters",1,NULL)) as preMast_count,count(IF(course_type="Pre-Sessional",1,NULL)) as preSess_count,
                                    count(IF(course_type="Phd",1,NULL)) as phd_count,count(IF(course_type="Summer School",1,NULL)) as summer_school_count,
                                    count(IF(course_type="Pathways Follow on",1,NULL)) as pathways_follow_count,count(IF(course_type="Year 2 Follow on",1,NULL)) as Y2_count,
                                    count(IF(course_type="Year 3 Follow on",1,NULL)) as Y3_count from application 
                                    left outer join students on students.student_id=application.student_id 
                                    where YEAR(course_start_date)=%s and office_id=%s"""
                preValue = (int(selectedYear) - 1, officeId,)

            else:
                sqlSelectCount = """select count(*) as total_count, count(IF(course_type="Foundation",1,NULL)) as foundation_count, 
                        count(IF(course_type="Undergraduate",1,NULL)) as ug_count,count(IF(course_type="Postgraduate",1,NULL)) as pg_count,
                        count(IF(course_type="Pre-Masters",1,NULL)) as preMast_count,count(IF(course_type="Pre-Sessional",1,NULL)) as preSess_count,
                        count(IF(course_type="Phd",1,NULL)) as phd_count,count(IF(course_type="Summer School",1,NULL)) as summer_school_count,
                        count(IF(course_type="Pathways Follow on",1,NULL)) as pathways_follow_count,count(IF(course_type="Year 2 Follow on",1,NULL)) as Y2_count,
                        count(IF(course_type="Year 3 Follow on",1,NULL)) as Y3_count from application where YEAR(course_start_date)=%s"""
                value = (selectedYear,)

                sqlSelectPreCount = """select count(*) as total_count, count(IF(course_type="Foundation",1,NULL)) as foundation_count, 
                                    count(IF(course_type="Undergraduate",1,NULL)) as ug_count,count(IF(course_type="Postgraduate",1,NULL)) as pg_count,
                                    count(IF(course_type="Pre-Masters",1,NULL)) as preMast_count,count(IF(course_type="Pre-Sessional",1,NULL)) as preSess_count,
                                    count(IF(course_type="Phd",1,NULL)) as phd_count,count(IF(course_type="Summer School",1,NULL)) as summer_school_count,
                                    count(IF(course_type="Pathways Follow on",1,NULL)) as pathways_follow_count,count(IF(course_type="Year 2 Follow on",1,NULL)) as Y2_count,
                                    count(IF(course_type="Year 3 Follow on",1,NULL)) as Y3_count from application where YEAR(course_start_date)=%s;"""
                preValue = (int(selectedYear) - 1,)

            cursor.execute(sqlSelectCount, value)
            yearCount = cursor.fetchall()
            applicationCount.append(yearCount)

            cursor.execute(sqlSelectPreCount, preValue)
            prevYearCount = cursor.fetchall()
            applicationCount.append(prevYearCount)

        except mysql.Error as e:
            applicationCount.append(str(e))
        finally:
            cursor.close()
        return applicationCount


class getApplicationCSDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data['fromDate']
        toDate = data['toDate']
        officeId = data['officeId']
        courseType = data['courseType']
        courseTypes = courseType.split(",")
        institutionId = data['institutionId']
        institutionIds = institutionId.split(",")
        applicationReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if officeId != "" and "All" in courseTypes and "All" in institutionIds:
                sqlSelectAppReport = """select students.student_id as student_id, application_id, institution_name, first_name, 
                                    last_name, mobile_no, nationality, reference_no, course_type, course_start_date, 
                                    date_of_application_sent, offer_decision_type, tution_fee from application 
                                    left outer join students on students.student_id=application.student_id 
                                    where application.course_start_date BETWEEN %s AND %s and office_id=%s"""
                value = (fromDate, toDate, officeId,)
            elif officeId == "" and "All" not in courseTypes and "All" in institutionIds:
                sqlSelectAppReport = """select students.student_id as student_id, application_id, institution_name, first_name, 
                                    last_name, mobile_no, nationality, reference_no, course_type, course_start_date, 
                                    date_of_application_sent, offer_decision_type, tution_fee from application 
                                    left outer join students on students.student_id=application.student_id 
                                    where application.course_start_date BETWEEN %s AND %s and course_type IN ({})"""
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectAppReport = sqlSelectAppReport.format(courseTypeJoinData)

                value = [fromDate, toDate] + courseTypes
            elif officeId == "" and "All" in courseTypes and "All" not in institutionIds:
                sqlSelectAppReport = """select students.student_id as student_id, application_id, institution_name, first_name, 
                                    last_name, mobile_no, nationality, reference_no, course_type, course_start_date, 
                                    date_of_application_sent, offer_decision_type, tution_fee from application 
                                    left outer join students on students.student_id=application.student_id 
                                    where application.course_start_date BETWEEN %s AND %s and institution_id IN ({})"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectAppReport = sqlSelectAppReport.format(institutionIdJoinData)

                value = [fromDate, toDate] + institutionIds
            elif officeId == "" and "All" not in courseTypes and "All" not in institutionIds:
                sqlSelectAppReport = """select students.student_id as student_id, application_id, institution_name, first_name, 
                                    last_name, mobile_no, nationality, reference_no, course_type, course_start_date, 
                                    date_of_application_sent, offer_decision_type, tution_fee from application 
                                    left outer join students on students.student_id=application.student_id 
                                    where application.course_start_date BETWEEN %s AND %s and course_type IN ({}) and institution_id IN ({})"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectAppReport = sqlSelectAppReport.format(courseTypeJoinData, institutionIdJoinData)

                value = [fromDate, toDate] + courseTypes + institutionIds
            elif officeId != "" and "All" not in courseTypes and "All" not in institutionIds:
                sqlSelectAppReport = """select students.student_id as student_id, application_id, institution_name, first_name, 
                                    last_name, mobile_no, nationality, reference_no, course_type, course_start_date, 
                                    date_of_application_sent, offer_decision_type, tution_fee from application 
                                    left outer join students on students.student_id=application.student_id 
                                    where application.course_start_date BETWEEN %s AND %s and office_id=%s and course_type IN ({}) and 
                                    institution_id IN ({})"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectAppReport = sqlSelectAppReport.format(courseTypeJoinData, institutionIdJoinData)

                value = [fromDate, toDate, officeId] + courseTypes + institutionIds
            elif officeId != "" and "All" not in courseTypes and "All" in institutionIds:
                sqlSelectAppReport = """select students.student_id as student_id, application_id, institution_name, first_name, 
                                    last_name, mobile_no, nationality, reference_no, course_type, course_start_date, 
                                    date_of_application_sent, offer_decision_type, tution_fee from application 
                                    left outer join students on students.student_id=application.student_id 
                                    where application.course_start_date BETWEEN %s AND %s and office_id=%s and course_type IN ({})"""
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectAppReport = sqlSelectAppReport.format(courseTypeJoinData)

                value = [fromDate, toDate, officeId] + courseTypes
            elif officeId != "" and "All" in courseTypes and "All" not in institutionIds:
                sqlSelectAppReport = """select students.student_id as student_id, application_id, institution_name, first_name, 
                                    last_name, mobile_no, nationality, reference_no, course_type, course_start_date, 
                                    date_of_application_sent, offer_decision_type, tution_fee from application 
                                    left outer join students on students.student_id=application.student_id 
                                    where application.course_start_date BETWEEN %s AND %s and office_id=%s and institution_id IN ({})"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectAppReport = sqlSelectAppReport.format(institutionIdJoinData)

                value = [fromDate, toDate, officeId] + institutionIds
            else:
                sqlSelectAppReport = """select students.student_id as student_id, application_id, institution_name, first_name, 
                                    last_name, mobile_no, nationality, reference_no, course_type, course_start_date, 
                                    date_of_application_sent, offer_decision_type, tution_fee from application 
                                    left outer join students on students.student_id=application.student_id 
                                    where application.course_start_date BETWEEN %s AND %s"""
                value = (fromDate, toDate,)
            cursor.execute(sqlSelectAppReport, value)
            appReport = cursor.fetchall()
            if appReport:
                applicationReport = json.dumps(appReport, default=str)
            else:
                applicationReport.append('No data found')

        except mysql.Error as e:
            applicationReport.append(str(e))
        finally:
            cursor.close()
        return applicationReport


# Old code kannan
# class getApplicationCSDCount(Resource):
#     def post(self):
#         data = request.get_json(force=True)
#         fromDate = data['fromDate']
#         toDate = data['toDate']
#         officeId = data['officeId']
#         courseType = data['courseType']
#         applicationReport = []
#         cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
#         cursor = cnx.cursor()
#         try:
#             if(courseType!="" and officeId!=""):
#                 sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count,
#                                     SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count,
#                                     SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
#                                     FROM application
#                                     left outer join students on students.student_id=application.student_id
#                                     where application.course_start_date BETWEEN %s AND %s
#                                     and office_id=%s and course_type=%s"""
#                 value = (fromDate, toDate, officeId, courseType,)
#             elif(courseType!="" and officeId==""):
#                 sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count,
#                                     SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count,
#                                     SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
#                                     FROM application
#                                     left outer join students on students.student_id=application.student_id
#                                     where application.course_start_date BETWEEN %s AND %s
#                                     and course_type=%s"""
#                 value = (fromDate, toDate, courseType,)
#             elif(officeId!="" and courseType==""):
#                 sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count,
#                                     SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count,
#                                     SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
#                                     FROM application
#                                     left outer join students on students.student_id=application.student_id
#                                     where application.course_start_date BETWEEN %s AND %s and office_id=%s"""
#                 value = (fromDate, toDate, officeId,)
#             else:
#                 sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count,
#                                     SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count,
#                                     SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
#                                     FROM application
#                                     left outer join students on students.student_id=application.student_id
#                                     where application.course_start_date BETWEEN %s AND %s"""
#                 value = (fromDate, toDate,)
#             cursor.execute(sqlSelectAppReport, value)
#             appReport = cursor.fetchall()
#             if appReport:
#                 applicationReport = json.dumps(appReport, default=str)
#             else:
#                 applicationReport.append('No data found')
#
#         except mysql.Error as e:
#             applicationReport.append(str(e))
#         finally:
#             cursor.close()
#         return applicationReport

class getApplicationCSDCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data['fromDate']
        toDate = data['toDate']
        officeId = data['officeId']
        courseType = data['courseType']
        courseTypes = courseType.split(",")
        institutionId = data['institutionId']
        institutionIds = institutionId.split(",")
        applicationReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if officeId != "" and "All" in courseTypes and "All" in institutionIds:
                sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count,
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count,
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
                                    FROM application
                                    left outer join students on students.student_id=application.student_id
                                    where application.course_start_date BETWEEN %s AND %s and office_id=%s"""
                value = (fromDate, toDate, officeId,)
            elif officeId == "" and "All" not in courseTypes and "All" in institutionIds:
                sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count,
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count,
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
                                    FROM application
                                    left outer join students on students.student_id=application.student_id
                                    where application.course_start_date BETWEEN %s AND %s and course_type IN ({})"""
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectAppReport = sqlSelectAppReport.format(courseTypeJoinData)

                value = [fromDate, toDate] + courseTypes
            elif officeId == "" and "All" in courseTypes and "All" not in institutionIds:
                sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count,
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count,
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
                                    FROM application
                                    left outer join students on students.student_id=application.student_id
                                    where application.course_start_date BETWEEN %s AND %s and institution_id IN ({})"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectAppReport = sqlSelectAppReport.format(institutionIdJoinData)

                value = [fromDate, toDate] + institutionIds
            elif officeId == "" and "All" not in courseTypes and "All" not in institutionIds:
                sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count,
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count,
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
                                    FROM application
                                    left outer join students on students.student_id=application.student_id
                                    where application.course_start_date BETWEEN %s AND %s and course_type IN ({}) and institution_id IN ({})"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectAppReport = sqlSelectAppReport.format(courseTypeJoinData, institutionIdJoinData)

                value = [fromDate, toDate] + courseTypes + institutionIds
            elif officeId != "" and "All" not in courseTypes and "All" not in institutionIds:
                sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count,
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count,
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
                                    FROM application
                                    left outer join students on students.student_id=application.student_id
                                    where application.course_start_date BETWEEN %s AND %s and office_id=%s and course_type IN ({}) and 
                                    institution_id IN ({})"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectAppReport = sqlSelectAppReport.format(courseTypeJoinData, institutionIdJoinData)

                value = [fromDate, toDate, officeId] + courseTypes + institutionIds
            elif officeId != "" and "All" not in courseTypes and "All" in institutionIds:
                sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count,
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count,
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
                                    FROM application
                                    left outer join students on students.student_id=application.student_id
                                    where application.course_start_date BETWEEN %s AND %s and office_id=%s and course_type IN ({})"""
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectAppReport = sqlSelectAppReport.format(courseTypeJoinData)

                value = [fromDate, toDate, officeId] + courseTypes
            elif officeId != "" and "All" in courseTypes and "All" not in institutionIds:
                sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count,
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count,
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
                                    FROM application
                                    left outer join students on students.student_id=application.student_id
                                    where application.course_start_date BETWEEN %s AND %s and office_id=%s and institution_id IN ({})"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectAppReport = sqlSelectAppReport.format(institutionIdJoinData)

                value = [fromDate, toDate, officeId] + institutionIds
            else:
                sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count,
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count,
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
                                    FROM application
                                    left outer join students on students.student_id=application.student_id
                                    where application.course_start_date BETWEEN %s AND %s"""
                value = (fromDate, toDate,)
            cursor.execute(sqlSelectAppReport, value)
            appReport = cursor.fetchall()
            if appReport:
                applicationReport = json.dumps(appReport, default=str)
            else:
                applicationReport.append('No data found')

        except mysql.Error as e:
            applicationReport.append(str(e))
        finally:
            cursor.close()
        return applicationReport


class getApplicationASDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data['fromDate']
        toDate = data['toDate']
        officeId = data['officeId']
        courseType = data['courseType']
        courseTypes = courseType.split(",")
        institutionId = data['institutionId']
        institutionIds = institutionId.split(",")
        applicationReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if officeId != "" and "All" in courseTypes and "All" in institutionIds:
                sqlSelectAppReport = """select students.student_id as student_id, application_id, institution_name, first_name, 
                                    last_name, mobile_no, nationality, reference_no, course_type, course_start_date, 
                                    date_of_application_sent, offer_decision_type, tution_fee from application 
                                    left outer join students on students.student_id=application.student_id 
                                    where application.date_of_application_sent BETWEEN %s AND %s and office_id=%s"""
                value = (fromDate, toDate, officeId,)
            elif officeId == "" and "All" not in courseTypes and "All" in institutionIds:
                sqlSelectAppReport = """select students.student_id as student_id, application_id, institution_name, first_name, 
                                    last_name, mobile_no, nationality, reference_no, course_type, course_start_date, 
                                    date_of_application_sent, offer_decision_type, tution_fee from application 
                                    left outer join students on students.student_id=application.student_id 
                                    where application.date_of_application_sent BETWEEN %s AND %s and course_type IN ({})"""
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectAppReport = sqlSelectAppReport.format(courseTypeJoinData)

                value = [fromDate, toDate] + courseTypes
            elif officeId == "" and "All" in courseTypes and "All" not in institutionIds:
                sqlSelectAppReport = """select students.student_id as student_id, application_id, institution_name, first_name, 
                                    last_name, mobile_no, nationality, reference_no, course_type, course_start_date, 
                                    date_of_application_sent, offer_decision_type, tution_fee from application 
                                    left outer join students on students.student_id=application.student_id 
                                    where application.date_of_application_sent BETWEEN %s AND %s and institution_id IN ({})"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectAppReport = sqlSelectAppReport.format(institutionIdJoinData)

                value = [fromDate, toDate] + institutionIds
            elif officeId == "" and "All" not in courseTypes and "All" not in institutionIds:
                sqlSelectAppReport = """select students.student_id as student_id, application_id, institution_name, first_name, 
                                    last_name, mobile_no, nationality, reference_no, course_type, course_start_date, 
                                    date_of_application_sent, offer_decision_type, tution_fee from application 
                                    left outer join students on students.student_id=application.student_id 
                                    where application.date_of_application_sent BETWEEN %s AND %s and course_type IN ({}) and institution_id IN ({})"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectAppReport = sqlSelectAppReport.format(courseTypeJoinData, institutionIdJoinData)

                value = [fromDate, toDate] + courseTypes + institutionIds
            elif officeId != "" and "All" not in courseTypes and "All" not in institutionIds:
                sqlSelectAppReport = """select students.student_id as student_id, application_id, institution_name, first_name, 
                                    last_name, mobile_no, nationality, reference_no, course_type, course_start_date, 
                                    date_of_application_sent, offer_decision_type, tution_fee from application 
                                    left outer join students on students.student_id=application.student_id 
                                    where application.date_of_application_sent BETWEEN %s AND %s and office_id=%s and course_type IN ({}) and 
                                    institution_id IN ({})"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectAppReport = sqlSelectAppReport.format(courseTypeJoinData, institutionIdJoinData)

                value = [fromDate, toDate, officeId] + courseTypes + institutionIds
            elif officeId != "" and "All" not in courseTypes and "All" in institutionIds:
                sqlSelectAppReport = """select students.student_id as student_id, application_id, institution_name, first_name, 
                                    last_name, mobile_no, nationality, reference_no, course_type, course_start_date, 
                                    date_of_application_sent, offer_decision_type, tution_fee from application 
                                    left outer join students on students.student_id=application.student_id 
                                    where application.date_of_application_sent BETWEEN %s AND %s and office_id=%s and course_type IN ({})"""
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectAppReport = sqlSelectAppReport.format(courseTypeJoinData)

                value = [fromDate, toDate, officeId] + courseTypes
            elif officeId != "" and "All" in courseTypes and "All" not in institutionIds:
                sqlSelectAppReport = """select students.student_id as student_id, application_id, institution_name, first_name, 
                                    last_name, mobile_no, nationality, reference_no, course_type, course_start_date, 
                                    date_of_application_sent, offer_decision_type, tution_fee from application 
                                    left outer join students on students.student_id=application.student_id 
                                    where application.date_of_application_sent BETWEEN %s AND %s and office_id=%s and institution_id IN ({})"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectAppReport = sqlSelectAppReport.format(institutionIdJoinData)

                value = [fromDate, toDate, officeId] + institutionIds
            else:
                sqlSelectAppReport = """select students.student_id as student_id, application_id, institution_name, first_name, 
                                    last_name, mobile_no, nationality, reference_no, course_type, course_start_date, 
                                    date_of_application_sent, offer_decision_type, tution_fee from application 
                                    left outer join students on students.student_id=application.student_id 
                                    where application.date_of_application_sent BETWEEN %s AND %s"""
                value = (fromDate, toDate,)
            cursor.execute(sqlSelectAppReport, value)
            appReport = cursor.fetchall()
            if appReport:
                applicationReport = json.dumps(appReport, default=str)
            else:
                applicationReport.append('No data found')

        except mysql.Error as e:
            applicationReport.append(str(e))
        finally:
            cursor.close()
        return applicationReport


# Old code Kannan
# class getApplicationASDCount(Resource):
#     def post(self):
#         data = request.get_json(force=True)
#         fromDate = data['fromDate']
#         toDate = data['toDate']
#         officeId = data['officeId']
#         courseType = data['courseType']
#         applicationReport = []
#         cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
#         cursor = cnx.cursor()
#         try:
#             if (courseType != "" and officeId != ""):
#                 sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count,
#                                     SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count,
#                                     SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
#                                     FROM application
#                                     left outer join students on students.student_id=application.student_id
#                                     where date_of_application_sent BETWEEN %s AND %s
#                                     and office_id=%s and course_type=%s"""
#                 value = (fromDate, toDate, officeId, courseType,)
#             elif (courseType != "" and officeId == ""):
#                 sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count,
#                                     SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count,
#                                     SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
#                                     FROM application
#                                     left outer join students on students.student_id=application.student_id
#                                     where date_of_application_sent BETWEEN %s AND %s
#                                     and course_type=%s"""
#                 value = (fromDate, toDate, courseType,)
#             elif (officeId != "" and courseType == ""):
#                 sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count,
#                                     SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count,
#                                     SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
#                                     FROM application
#                                     left outer join students on students.student_id=application.student_id
#                                 where date_of_application_sent BETWEEN %s AND %s and office_id=%s"""
#                 value = (fromDate, toDate, officeId,)
#             else:
#                 sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count,
#                                     SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count,
#                                     SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
#                                     FROM application
#                                     left outer join students on students.student_id=application.student_id
#                                     where date_of_application_sent BETWEEN %s AND %s"""
#                 value = (fromDate, toDate,)
#             cursor.execute(sqlSelectAppReport, value)
#             appReport = cursor.fetchall()
#             if appReport:
#                 applicationReport = json.dumps(appReport, default=str)
#             else:
#                 applicationReport.append('No data found')
#
#         except mysql.Error as e:
#             applicationReport.append(str(e))
#         finally:
#             cursor.close()
#         return applicationReport

class getApplicationASDCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data['fromDate']
        toDate = data['toDate']
        officeId = data['officeId']
        courseType = data['courseType']
        courseTypes = courseType.split(",")
        institutionId = data['institutionId']
        institutionIds = institutionId.split(",")
        applicationReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if officeId != "" and "All" in courseTypes and "All" in institutionIds:
                sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
                                    FROM application
                                    left outer join students on students.student_id=application.student_id  
                                    where date_of_application_sent BETWEEN %s AND %s and office_id=%s"""
                value = (fromDate, toDate, officeId,)
            elif officeId == "" and "All" not in courseTypes and "All" in institutionIds:
                sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
                                    FROM application
                                    left outer join students on students.student_id=application.student_id  
                                    where date_of_application_sent BETWEEN %s AND %s and course_type IN ({})"""
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectAppReport = sqlSelectAppReport.format(courseTypeJoinData)

                value = [fromDate, toDate] + courseTypes
            elif officeId == "" and "All" in courseTypes and "All" not in institutionIds:
                sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
                                    FROM application
                                    left outer join students on students.student_id=application.student_id  
                                    where date_of_application_sent BETWEEN %s AND %s and institution_id IN ({})"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectAppReport = sqlSelectAppReport.format(institutionIdJoinData)

                value = [fromDate, toDate] + institutionIds
            elif officeId == "" and "All" not in courseTypes and "All" not in institutionIds:
                sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
                                    FROM application
                                    left outer join students on students.student_id=application.student_id  
                                    where date_of_application_sent BETWEEN %s AND %s and course_type IN ({}) and institution_id IN ({})"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectAppReport = sqlSelectAppReport.format(courseTypeJoinData, institutionIdJoinData)

                value = [fromDate, toDate] + courseTypes + institutionIds
            elif officeId != "" and "All" not in courseTypes and "All" not in institutionIds:
                sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
                                    FROM application
                                    left outer join students on students.student_id=application.student_id  
                                    where date_of_application_sent BETWEEN %s AND %s and office_id=%s and course_type IN ({}) and 
                                            institution_id IN ({})"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectAppReport = sqlSelectAppReport.format(courseTypeJoinData, institutionIdJoinData)

                value = [fromDate, toDate, officeId] + courseTypes + institutionIds
            elif officeId != "" and "All" not in courseTypes and "All" in institutionIds:
                sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
                                    FROM application
                                    left outer join students on students.student_id=application.student_id  
                                    where date_of_application_sent BETWEEN %s AND %s and office_id=%s and course_type IN ({})"""
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectAppReport = sqlSelectAppReport.format(courseTypeJoinData)

                value = [fromDate, toDate, officeId] + courseTypes
            elif officeId != "" and "All" in courseTypes and "All" not in institutionIds:
                sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
                                    FROM application
                                    left outer join students on students.student_id=application.student_id  
                                    where date_of_application_sent BETWEEN %s AND %s and office_id=%s and institution_id IN ({})"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectAppReport = sqlSelectAppReport.format(institutionIdJoinData)

                value = [fromDate, toDate, officeId] + institutionIds
            else:
                sqlSelectAppReport = """SELECT COUNT(DISTINCT application.student_id) AS total_student_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count
                                    FROM application
                                    left outer join students on students.student_id=application.student_id  
                                    where date_of_application_sent BETWEEN %s AND %s"""
                value = (fromDate, toDate,)
            cursor.execute(sqlSelectAppReport, value)
            appReport = cursor.fetchall()
            if appReport:
                applicationReport = json.dumps(appReport, default=str)
            else:
                applicationReport.append('No data found')

        except mysql.Error as e:
            applicationReport.append(str(e))
        finally:
            cursor.close()
        return applicationReport


class getOfficesCounsilors(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        officeIds = officeId.split(",")
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        officeCounsilors = []
        cursor = cnx.cursor()
        try:
            if 'All' in officeIds:
                sqlSelectCounsilor = """select user_id, office_id, username, name from users where username !='admin' and role !='partner' and deactivate=0"""
                cursor.execute(sqlSelectCounsilor, ())
            else:
                sqlSelectCounsilor = """select user_id, office_id, username, name from users where office_id in (%s) and username !='admin' and role !='partner' and deactivate=0"""
                placeholders = ', '.join(['%s'] * len(officeIds))
                sql = sqlSelectCounsilor % placeholders
                cursor.execute(sql, officeIds)
            officeCounsilor = cursor.fetchall()
            if officeCounsilor:
                officeCounsilors = json.dumps(officeCounsilor, default=str)
            else:
                officeCounsilors.append('No data found')

        except mysql.Error as e:
            officeCounsilors.append(str(e))
        finally:
            cursor.close()
        return officeCounsilors


class getFinalChoiceCSDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        toDate = datetime.strptime(toDate, '%Y-%m-%d')
        toDate = toDate + timedelta(days=1)
        toDate = toDate.strftime('%Y-%m-%d')
        officeId = data["officeId"]
        officeIds = officeId.split(",")
        staffId = data["staffId"]
        staffIds = staffId.split(",")
        courseType = data["courseType"]
        courseTypes = courseType.split(",")
        institutionId = data["institutionId"];
        institutionIds = institutionId.split(",")
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        finalChoiceCSDReport = []
        cursor = cnx.cursor()
        try:
            if "All" in officeIds and "All" in staffIds and "All" in courseTypes and "All" in institutionIds:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE course_start_date BETWEEN %s AND %s and final_choiced=1"""
                query_params = [fromDate, toDate]
            elif "All" not in officeIds and "All" in staffIds and "All" in courseTypes and "All" in institutionIds:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE course_start_date BETWEEN %s AND %s
                                    AND students.office_id IN ({}) and final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))

                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate] + officeIds
            elif "All" in officeIds and "All" not in staffIds and "All" in courseTypes and "All" in institutionIds:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE course_start_date BETWEEN %s AND %s
                                    AND counsilor_id IN ({}) and final_choiced=1"""
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))
                sqlSelectCSDReport = sqlSelectCSDReport.format(staffIdJoinData)

                query_params = [fromDate, toDate] + staffIds
            elif "All" in officeIds and "All" in staffIds and "All" not in courseTypes and "All" in institutionIds:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE course_start_date BETWEEN %s AND %s
                                    AND course_type IN ({}) and final_choiced=1"""
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectCSDReport = sqlSelectCSDReport.format(courseTypeJoinData)

                query_params = [fromDate, toDate] + courseTypes
            elif "All" not in officeIds and "All" not in staffIds and "All" in courseTypes and "All" in institutionIds:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE course_start_date BETWEEN %s AND %s
                                    AND students.office_id IN ({})
                                    AND counsilor_id IN ({}) and final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))

                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData, staffIdJoinData)

                query_params = [fromDate, toDate] + officeIds + staffIds
            elif "All" not in officeIds and "All" in staffIds and "All" not in courseTypes and "All" in institutionIds:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE course_start_date BETWEEN %s AND %s
                                    AND students.office_id IN ({})
                                    AND course_type IN ({}) and final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData, courseTypeJoinData)

                query_params = [fromDate, toDate] + officeIds + courseTypes
            elif "All" in officeIds and "All" not in staffIds and "All" not in courseTypes and "All" in institutionIds:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE course_start_date BETWEEN %s AND %s
                                    AND counsilor_id IN ({})
                                    AND course_type IN ({}) and final_choiced=1"""
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectCSDReport = sqlSelectCSDReport.format(staffIdJoinData, courseTypeJoinData)

                query_params = [fromDate, toDate] + staffIds + courseTypes
            elif "All" in officeIds and "All" in staffIds and "All" in courseTypes and "All" not in institutionIds:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE course_start_date BETWEEN %s AND %s and institution_id in ({}) and final_choiced=1"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectCSDReport = sqlSelectCSDReport.format(institutionIdJoinData)

                query_params = [fromDate, toDate] + institutionIds
            elif "All" in officeIds and "All" in staffIds and "All" not in courseTypes and "All" not in institutionIds:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE course_start_date BETWEEN %s AND %s
                                    AND course_type IN ({}) and institution_id in ({}) and final_choiced=1"""
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectCSDReport = sqlSelectCSDReport.format(courseTypeJoinData, institutionIdJoinData)

                query_params = [fromDate, toDate] + courseTypes + institutionIds
            elif "All" in officeIds and "All" not in staffIds and "All" in courseTypes and "All" not in institutionIds:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE course_start_date BETWEEN %s AND %s
                                    AND counsilor_id IN ({}) and institution_id in ({}) and final_choiced=1"""
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectCSDReport = sqlSelectCSDReport.format(staffIdJoinData, institutionIdJoinData)

                query_params = [fromDate, toDate] + staffIds + institutionIds
            elif "All" not in officeIds and "All" in staffIds and "All" in courseTypes and "All" not in institutionIds:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE course_start_date BETWEEN %s AND %s
                                    AND students.office_id IN ({}) and institution_id in ({}) and final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData, institutionIdJoinData)

                query_params = [fromDate, toDate] + officeIds + institutionIds
            elif "All" not in officeIds and "All" not in staffIds and "All" in courseTypes and "All" not in institutionIds:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE course_start_date BETWEEN %s AND %s
                                    AND students.office_id IN ({})
                                    AND counsilor_id IN ({}) and institution_id in ({}) and final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData, staffIdJoinData, institutionIdJoinData)

                query_params = [fromDate, toDate] + officeIds + staffIds + institutionIds
            elif "All" not in officeIds and "All" in staffIds and "All" not in courseTypes and "All" not in institutionIds:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE course_start_date BETWEEN %s AND %s
                                    AND students.office_id IN ({})
                                    AND course_type IN ({}) and institution_id in ({}) and final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData, courseTypeJoinData,
                                                               institutionIdJoinData)

                query_params = [fromDate, toDate] + officeIds + courseTypes + institutionIds
            elif "All" in officeIds and "All" not in staffIds and "All" not in courseTypes and "All" not in institutionIds:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE course_start_date BETWEEN %s AND %s
                                    AND counsilor_id IN ({})
                                    AND course_type IN ({}) and institution_id in ({}) and final_choiced=1"""
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectCSDReport = sqlSelectCSDReport.format(staffIdJoinData, courseTypeJoinData,
                                                               institutionIdJoinData)

                query_params = [fromDate, toDate] + staffIds + courseTypes + institutionIds
            elif "All" not in officeIds and "All" not in staffIds and "All" not in courseTypes and "All" in institutionIds:
                sqlSelectCSDReport = """
                                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                                    visa_decision, visa_decision_date
                                                    FROM application
                                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                                    WHERE course_start_date BETWEEN %s AND %s
                                                    AND students.office_id IN ({})
                                                    AND counsilor_id IN ({})
                                                    AND course_type IN ({}) and final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData, staffIdJoinData, courseTypeJoinData)

                query_params = [fromDate, toDate] + officeIds + staffIds + courseTypes
            else:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date
                                    FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE course_start_date BETWEEN %s AND %s
                                    AND students.office_id IN ({})
                                    AND counsilor_id IN ({})
                                    AND course_type IN ({}) and institution_id in ({}) and final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData, staffIdJoinData, courseTypeJoinData,
                                                               institutionIdJoinData)

                query_params = [fromDate, toDate] + officeIds + staffIds + courseTypes + institutionIds

            cursor.execute(sqlSelectCSDReport, query_params)
            csdReport = cursor.fetchall()
            if csdReport:
                finalChoiceCSDReport = json.dumps(csdReport, default=str)
            else:
                finalChoiceCSDReport.append('No data found')

        except mysql.Error as e:
            finalChoiceCSDReport.append(str(e))
        finally:
            cursor.close()
        return finalChoiceCSDReport


class getFinalChoiceASDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        toDate = datetime.strptime(toDate, '%Y-%m-%d')
        toDate = toDate + timedelta(days=1)
        toDate = toDate.strftime('%Y-%m-%d')
        officeId = data["officeId"]
        officeIds = officeId.split(",")
        staffId = data["staffId"]
        staffIds = staffId.split(",")
        courseType = data["courseType"]
        courseTypes = courseType.split(",")
        institutionId = data["institutionId"];
        institutionIds = institutionId.split(",")
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        finalChoiceASDReport = []
        cursor = cnx.cursor()
        try:
            if "All" in officeIds and "All" in staffIds and "All" in courseTypes and "All" in institutionIds:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s and final_choiced=1"""
                query_params = [fromDate, toDate]
            elif "All" not in officeIds and "All" in staffIds and "All" in courseTypes and "All" in institutionIds:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s
                                    AND students.office_id IN ({}) and final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))

                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate] + officeIds
            elif "All" in officeIds and "All" not in staffIds and "All" in courseTypes and "All" in institutionIds:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s
                                    AND counsilor_id IN ({}) and final_choiced=1"""
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))
                sqlSelectASDReport = sqlSelectASDReport.format(staffIdJoinData)

                query_params = [fromDate, toDate] + staffIds
            elif "All" in officeIds and "All" in staffIds and "All" not in courseTypes and "All" in institutionIds:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s
                                    AND course_type IN ({}) and final_choiced=1"""
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectASDReport = sqlSelectASDReport.format(courseTypeJoinData)

                query_params = [fromDate, toDate] + courseTypes
            elif "All" not in officeIds and "All" not in staffIds and "All" in courseTypes and "All" in institutionIds:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s
                                    AND students.office_id IN ({})
                                    AND counsilor_id IN ({}) and final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))

                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData, staffIdJoinData)

                query_params = [fromDate, toDate] + officeIds + staffIds
            elif "All" not in officeIds and "All" in staffIds and "All" not in courseTypes and "All" in institutionIds:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s
                                    AND students.office_id IN ({})
                                    AND course_type IN ({}) and final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData, courseTypeJoinData)

                query_params = [fromDate, toDate] + officeIds + courseTypes
            elif "All" in officeIds and "All" not in staffIds and "All" not in courseTypes and "All" in institutionIds:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s
                                    AND counsilor_id IN ({})
                                    AND course_type IN ({}) and final_choiced=1"""
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectASDReport = sqlSelectASDReport.format(staffIdJoinData, courseTypeJoinData)

                query_params = [fromDate, toDate] + staffIds + courseTypes
            elif "All" in officeIds and "All" in staffIds and "All" in courseTypes and "All" not in institutionIds:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s and institution_id in ({}) and final_choiced=1"""
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectASDReport = sqlSelectASDReport.format(institutionIdJoinData)

                query_params = [fromDate, toDate] + institutionIds
            elif "All" in officeIds and "All" in staffIds and "All" not in courseTypes and "All" not in institutionIds:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s
                                    AND course_type IN ({}) and institution_id in ({}) and final_choiced=1"""
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectASDReport = sqlSelectASDReport.format(courseTypeJoinData, institutionIdJoinData)

                query_params = [fromDate, toDate] + courseTypes + institutionIds
            elif "All" in officeIds and "All" not in staffIds and "All" in courseTypes and "All" not in institutionIds:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s
                                    AND counsilor_id IN ({}) and institution_id in ({}) and final_choiced=1"""
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectASDReport = sqlSelectASDReport.format(staffIdJoinData, institutionIdJoinData)

                query_params = [fromDate, toDate] + staffIds + institutionIds
            elif "All" not in officeIds and "All" in staffIds and "All" in courseTypes and "All" not in institutionIds:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s
                                    AND students.office_id IN ({}) and institution_id in ({}) and final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData, institutionIdJoinData)

                query_params = [fromDate, toDate] + officeIds + institutionIds
            elif "All" not in officeIds and "All" not in staffIds and "All" in courseTypes and "All" not in institutionIds:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s
                                    AND students.office_id IN ({})
                                    AND counsilor_id IN ({}) and institution_id in ({}) and final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData, staffIdJoinData, institutionIdJoinData)

                query_params = [fromDate, toDate] + officeIds + staffIds + institutionIds
            elif "All" not in officeIds and "All" in staffIds and "All" not in courseTypes and "All" not in institutionIds:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s
                                    AND students.office_id IN ({})
                                    AND course_type IN ({}) and institution_id in ({}) and final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData, courseTypeJoinData,
                                                               institutionIdJoinData)

                query_params = [fromDate, toDate] + officeIds + courseTypes + institutionIds
            elif "All" in officeIds and "All" not in staffIds and "All" not in courseTypes and "All" not in institutionIds:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s
                                    AND counsilor_id IN ({})
                                    AND course_type IN ({}) and institution_id in ({}) and final_choiced=1"""
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectASDReport = sqlSelectASDReport.format(staffIdJoinData, courseTypeJoinData,
                                                               institutionIdJoinData)

                query_params = [fromDate, toDate] + staffIds + courseTypes + institutionIds
            elif "All" not in officeIds and "All" not in staffIds and "All" not in courseTypes and "All" in institutionIds:
                sqlSelectASDReport = """
                                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                                    visa_decision, visa_decision_date
                                                    FROM application
                                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                                    WHERE date_of_application_sent BETWEEN %s AND %s
                                                    AND students.office_id IN ({})
                                                    AND counsilor_id IN ({})
                                                    AND course_type IN ({}) and final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))

                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData, staffIdJoinData, courseTypeJoinData)

                query_params = [fromDate, toDate] + officeIds + staffIds + courseTypes
            else:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, institution_name, course_type,
                                    course_start_date, name, deposit_amount, deposit_paid_date, cas_issued, visa_applied_date,
                                    visa_decision, visa_decision_date
                                    FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s
                                    AND students.office_id IN ({})
                                    AND counsilor_id IN ({})
                                    AND course_type IN ({}) and institution_id in ({}) and final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))
                courseTypeJoinData = ', '.join(['%s'] * len(courseTypes))
                institutionIdJoinData = ', '.join(['%s'] * len(institutionIds))

                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData, staffIdJoinData, courseTypeJoinData,
                                                               institutionIdJoinData)

                query_params = [fromDate, toDate] + officeIds + staffIds + courseTypes + institutionIds
            cursor.execute(sqlSelectASDReport, query_params)
            asdReport = cursor.fetchall()

            if asdReport:
                finalChoiceASDReport = json.dumps(asdReport, default=str)
            else:
                finalChoiceASDReport.append('No data found')

        except mysql.Error as e:
            finalChoiceASDReport.append(str(e))
        finally:
            cursor.close()
        return finalChoiceASDReport


class getStudentManagerEDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]

        # Convert toDate to include the full day
        toDate = datetime.strptime(toDate, '%Y-%m-%d') + timedelta(days=1)
        toDate = toDate.strftime('%Y-%m-%d')

        officeId = data["officeId"]
        officeIds = officeId.split(",")

        staffId = data["staffId"]
        staffIds = staffId.split(",")

        status = data["status"]
        status = status.split(",")

        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        studentManagerEDReport = []
        cursor = cnx.cursor()
        try:
            sqlSelectEDReport = """
                                SELECT students.student_id AS student_id, first_name, last_name, students.email, mobile_no, 
                                students.created_date, students.status, students.lead_source, note, office_name, utm_source,
                                utm_medium, utm_campaign FROM students 
                                LEFT OUTER JOIN notes ON students.student_id = notes.student_id 
                                LEFT OUTER JOIN offices ON students.office_id = offices.office_id 
                                WHERE (notes.student_id, notes.created_date) IN (SELECT student_id, MAX(notes.created_date) 
                                FROM notes GROUP BY student_id) and students.created_date BETWEEN %s AND %s
                                """
            query_params = [fromDate, toDate]

            if "All" not in officeIds:
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectEDReport += f" AND students.office_id IN ({officeIdJoinData})"
                query_params += officeIds

            if "All" not in staffIds:
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))
                sqlSelectEDReport += f" AND students.counsilor_id IN ({staffIdJoinData})"
                query_params += staffIds

            if "All" not in status:
                statusJoinData = ', '.join(['%s'] * len(status))
                sqlSelectEDReport += f" AND students.status IN ({statusJoinData})"
                query_params += status

            cursor.execute(sqlSelectEDReport, query_params)
            edReport = cursor.fetchall()

            if edReport:
                studentManagerEDReport = json.dumps(edReport, default=str)
            else:
                studentManagerEDReport.append('No data found')

        except mysql.Error as e:
            studentManagerEDReport.append(str(e))
        finally:
            cursor.close()
        return studentManagerEDReport


class getStaticCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]

        # Increment toDate by 1 day
        toDate = (datetime.strptime(toDate, "%Y-%m-%d") + timedelta(days=1)).strftime("%Y-%m-%d")

        officeId = data["officeId"]
        staffId = data["staffId"]

        officeIds = officeId.split(",")
        staffIds = staffId.split(",")

        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        staticCountReport = []
        cursor = cnx.cursor()
        try:
            sqlSelectCountReport = """
                                    select 
                                    count(DISTINCT IF(students.lead_source="Web",students.student_id,NULL)) as enquiry_count, 
                                    count(DISTINCT IF(students.status="Active",students.student_id,NULL)) as active_count, 
                                    count(DISTINCT IF(students.status="Inactive",students.student_id,NULL)) as inactive_count, 
                                    count(DISTINCT IF(students.status="Closed",students.student_id,NULL)) as closed_count, 
                                    count(IF(cas_issued="casIssued",1,NULL)) as cas_count,
                                    COUNT(DISTINCT students.student_id) AS total_count,
                                    count(DISTINCT IF(
                                        students.status NOT IN ("Active", "Inactive", "Closed") AND 
                                        students.lead_source != "Web", 
                                        students.student_id, 
                                        NULL
                                    )) AS others_count
                                    from students left outer join application on students.student_id=application.student_id 
                                    where students.created_date BETWEEN %s AND %s
                                    """
            query_params = [fromDate, toDate]

            if "All" not in officeIds:
                sqlSelectCountReport += f" AND students.office_id IN ({', '.join(['%s'] * len(officeIds))})"
                query_params += officeIds
            if "All" not in staffIds:
                sqlSelectCountReport += f" AND students.counsilor_id IN ({', '.join(['%s'] * len(staffIds))})"
                query_params += staffIds

            cursor.execute(sqlSelectCountReport, query_params)
            countReport = cursor.fetchone()

            if countReport:
                staticCountReport = json.dumps(countReport, default=str)
            else:
                staticCountReport.append('No data found')
        except mysql.Error as e:
            staticCountReport.append(str(e))
        finally:
            cursor.close()
        return staticCountReport


class getStudentLogReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        toDate = datetime.strptime(toDate, '%Y-%m-%d')
        toDate = toDate + timedelta(days=1)
        toDate = toDate.strftime('%Y-%m-%d')
        officeId = data["officeId"]
        officeIds = officeId.split(",")
        staffId = data["staffId"]
        staffIds = staffId.split(",")
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        studentLogReport = []
        cursor = cnx.cursor()
        try:
            if "All" in officeIds and "All" in staffIds:
                sqlgetLogReport = """
                                    SELECT notes.student_id, first_name, last_name, notes.reminder_date, notes.created_date, 
                                    notes.note, note_user.name as staff, student_user.name as counsellor, notes.contact_type, 
                                    offices.office_name FROM notes 
                                    LEFT JOIN users AS note_user ON note_user.user_id = notes.counsilor_id 
                                    LEFT JOIN students ON students.student_id = notes.student_id 
                                    LEFT JOIN users AS student_user ON student_user.user_id = students.counsilor_id 
                                    LEFT JOIN offices ON offices.office_id = students.office_id 
                                    WHERE first_name IS NOT NULL and notes.created_date BETWEEN %s AND %s
                                    """

                query_params = [fromDate, toDate]
            elif "All" in officeIds and "All" not in staffIds:
                sqlgetLogReport = """
                                    SELECT notes.student_id, first_name, last_name, notes.reminder_date, notes.created_date, 
                                    notes.note, note_user.name as staff, student_user.name as counsellor, notes.contact_type, 
                                    offices.office_name FROM notes 
                                    LEFT JOIN users AS note_user ON note_user.user_id = notes.counsilor_id 
                                    LEFT JOIN students ON students.student_id = notes.student_id 
                                    LEFT JOIN users AS student_user ON student_user.user_id = students.counsilor_id 
                                    LEFT JOIN offices ON offices.office_id = students.office_id 
                                    WHERE first_name IS NOT NULL and notes.created_date BETWEEN %s AND %s
                                    AND notes.counsilor_id IN ({})
                                    """
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))

                sqlgetLogReport = sqlgetLogReport.format(staffIdJoinData)

                query_params = [fromDate, toDate] + staffIds
            elif "All" not in officeIds and "All" in staffIds:
                sqlgetLogReport = """
                                    SELECT notes.student_id, first_name, last_name, notes.reminder_date, notes.created_date, 
                                    notes.note, note_user.name as staff, student_user.name as counsellor, notes.contact_type, 
                                    offices.office_name FROM notes 
                                    LEFT JOIN users AS note_user ON note_user.user_id = notes.counsilor_id 
                                    LEFT JOIN students ON students.student_id = notes.student_id 
                                    LEFT JOIN users AS student_user ON student_user.user_id = students.counsilor_id 
                                    LEFT JOIN offices ON offices.office_id = students.office_id 
                                    WHERE first_name IS NOT NULL and notes.created_date BETWEEN %s AND %s
                                    AND students.office_id IN ({})
                                    """
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))

                sqlgetLogReport = sqlgetLogReport.format(officeIdJoinData)

                query_params = [fromDate, toDate] + officeIds
            else:
                sqlgetLogReport = """
                                    SELECT notes.student_id, first_name, last_name, notes.reminder_date, notes.created_date, 
                                    notes.note, note_user.name as staff, student_user.name as counsellor, notes.contact_type, 
                                    offices.office_name FROM notes 
                                    LEFT JOIN users AS note_user ON note_user.user_id = notes.counsilor_id 
                                    LEFT JOIN students ON students.student_id = notes.student_id 
                                    LEFT JOIN users AS student_user ON student_user.user_id = students.counsilor_id 
                                    LEFT JOIN offices ON offices.office_id = students.office_id 
                                    WHERE first_name IS NOT NULL and notes.created_date BETWEEN %s AND %s
                                    AND students.office_id IN ({})
                                    AND notes.counsilor_id IN ({})
                                    """

                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))

                sqlgetLogReport = sqlgetLogReport.format(officeIdJoinData, staffIdJoinData)

                query_params = [fromDate, toDate] + officeIds + staffIds

            cursor.execute(sqlgetLogReport, query_params)
            logReport = cursor.fetchall()

            if logReport:
                studentLogReport = json.dumps(logReport, default=str)
            else:
                studentLogReport.append('No data found')
        except mysql.Error as e:
            studentLogReport.append(str(e))
        finally:
            cursor.close()
        return studentLogReport


class updateReminderNoteStatus(Resource):
    def post(self):
        data = request.get_json(force=True)
        noteId = data["noteId"]
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        reminderDoneStatus = []
        cursor = cnx.cursor()
        try:
            sqlUpdateReminderNoteStatus = """update notes set status=0 where note_id=%s"""
            values = (noteId,)
            cursor.execute(sqlUpdateReminderNoteStatus, values)
            reminderDoneStatus.append('Updated')
        except mysql.Error as e:
            studentLogReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()
        return reminderDoneStatus


class getMissedReminderReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        toDate = datetime.strptime(toDate, '%Y-%m-%d')
        toDate = toDate + timedelta(days=1)
        toDate = toDate.strftime('%Y-%m-%d')
        officeId = data["officeId"]
        officeIds = officeId.split(",")
        countryOfIntrest = data["countryOfIntrest"]
        countryOfIntrests = countryOfIntrest.split(",")
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        missedReminderReport = []
        cursor = cnx.cursor()
        try:
            if "All" in officeIds and "All" in countryOfIntrests:
                sqlgetReminderReport = """
                                        SELECT notes.counsilor_id, users.name, COUNT(notes.note_id) AS note_count FROM notes 
                                        LEFT JOIN users ON users.user_id = notes.counsilor_id 
                                        LEFT JOIN students ON students.student_id = notes.student_id 
                                        WHERE reminder_date <= CURDATE() AND notes.status = 1 AND 
                                        students.status not in ("Inactive", "Closed")
                                        AND notes.created_date BETWEEN %s AND %s GROUP BY notes.counsilor_id
                                        """
                query_params = [fromDate, toDate]

            elif "All" in officeIds and "All" not in countryOfIntrests:
                sqlgetReminderReport = """
                                        SELECT notes.counsilor_id, users.name, COUNT(notes.note_id) AS note_count FROM notes 
                                        LEFT JOIN users ON users.user_id = notes.counsilor_id 
                                        LEFT JOIN students ON students.student_id = notes.student_id 
                                        WHERE reminder_date <= CURDATE() AND notes.status = 1 AND 
                                        students.status not in ("Inactive", "Closed") AND 
                                        notes.created_date BETWEEN %s AND %s AND 
                                        study_abroad_destination IN ({}) GROUP BY notes.counsilor_id
                                        """
                countryOfIntrestJoinData = ', '.join(['%s'] * len(countryOfIntrests))

                sqlgetReminderReport = sqlgetReminderReport.format(countryOfIntrestJoinData)

                query_params = [fromDate, toDate] + countryOfIntrests
            elif "All" not in officeIds and "All" in countryOfIntrests:
                sqlgetReminderReport = """
                                        SELECT notes.counsilor_id, users.name, COUNT(notes.note_id) AS note_count FROM notes 
                                        LEFT JOIN users ON users.user_id = notes.counsilor_id 
                                        LEFT JOIN students ON students.student_id = notes.student_id 
                                        WHERE reminder_date <= CURDATE() AND notes.status = 1 AND 
                                        students.status not in ("Inactive", "Closed") AND
                                        notes.created_date BETWEEN %s AND %s AND users.office_id IN ({})
                                        GROUP BY notes.counsilor_id
                                        """
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))

                sqlgetReminderReport = sqlgetReminderReport.format(officeIdJoinData)

                query_params = [fromDate, toDate] + officeIds
            else:
                sqlgetReminderReport = """
                                    SELECT notes.counsilor_id, users.name, COUNT(notes.note_id) AS note_count FROM notes 
                                    LEFT JOIN users ON users.user_id = notes.counsilor_id 
                                    LEFT JOIN students ON students.student_id = notes.student_id 
                                    WHERE reminder_date <= CURDATE() AND notes.status = 1 AND 
                                    students.status not in ("Inactive", "Closed") AND
                                    notes.created_date BETWEEN %s AND %s AND users.office_id IN ({}) AND 
                                    study_abroad_destination IN ({}) GROUP BY notes.counsilor_id
                                    """

                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                countryOfIntrestJoinData = ', '.join(['%s'] * len(countryOfIntrests))

                sqlgetReminderReport = sqlgetReminderReport.format(officeIdJoinData, countryOfIntrestJoinData)

                query_params = [fromDate, toDate] + officeIds + countryOfIntrests

            cursor.execute(sqlgetReminderReport, query_params)
            missedReport = cursor.fetchall()

            if missedReport:
                missedReminderReport = json.dumps(missedReport, default=str)
            else:
                missedReminderReport.append('No data found')
        except mysql.Error as e:
            missedReminderReport.append(str(e))
        finally:
            cursor.close()
        return missedReminderReport


class getUserMissedReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        toDate = datetime.strptime(toDate, '%Y-%m-%d')
        toDate = toDate + timedelta(days=1)
        toDate = toDate.strftime('%Y-%m-%d')
        officeId = data["officeId"]
        officeIds = officeId.split(",")
        countryOfIntrest = data["countryOfIntrest"]
        countryOfIntrests = countryOfIntrest.split(",")
        userId = data["userId"]
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        userMissedReminderReport = []
        cursor = cnx.cursor()
        try:
            if "All" in officeIds and "All" in countryOfIntrests:
                sqlgetReminderReport = """
                                        select students.student_id, first_name, last_name, notes.status, reminder_date, note, 
                                        students.status from notes 
                                        left outer join students on students.student_id=notes.student_id   
                                        WHERE reminder_date <= CURDATE() AND notes.status = 1 AND
                                        students.status not in ("Inactive", "Closed") AND 
                                        notes.created_date BETWEEN %s AND %s AND notes.counsilor_id=%s
                                        """
                query_params = [fromDate, toDate, userId]

            elif "All" in officeIds and "All" not in countryOfIntrests:
                sqlgetReminderReport = """
                                        select students.student_id, first_name, last_name, notes.status, reminder_date, note, 
                                        students.status from notes 
                                        left outer join students on students.student_id=notes.student_id   
                                        WHERE reminder_date <= CURDATE() AND notes.status = 1 AND 
                                        students.status not in ("Inactive", "Closed") AND
                                        notes.created_date BETWEEN %s AND %s AND notes.counsilor_id=%s AND 
                                        study_abroad_destination IN ({})
                                        """
                countryOfIntrestJoinData = ', '.join(['%s'] * len(countryOfIntrests))

                sqlgetReminderReport = sqlgetReminderReport.format(countryOfIntrestJoinData)

                query_params = [fromDate, toDate, userId] + countryOfIntrests
            elif "All" not in officeIds and "All" in countryOfIntrests:
                sqlgetReminderReport = """
                                        select students.student_id, first_name, last_name, notes.status, reminder_date, note, 
                                        students.status from notes 
                                        LEFT JOIN users ON users.user_id = notes.counsilor_id 
                                        left outer join students on students.student_id=notes.student_id   
                                        WHERE reminder_date <= CURDATE() AND notes.status = 1 AND 
                                        students.status not in ("Inactive", "Closed") AND
                                        notes.created_date BETWEEN %s AND %s AND notes.counsilor_id=%s 
                                        AND users.office_id IN ({})
                                        """
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))

                sqlgetReminderReport = sqlgetReminderReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, userId] + officeIds
            else:
                sqlgetReminderReport = """
                                    select students.student_id, first_name, last_name, notes.status, reminder_date, note, 
                                    students.status from notes 
                                    LEFT JOIN users ON users.user_id = notes.counsilor_id 
                                    left outer join students on students.student_id=notes.student_id  
                                    WHERE reminder_date <= CURDATE() AND notes.status = 1 AND 
                                    students.status not in ("Inactive", "Closed") AND
                                    notes.created_date BETWEEN %s AND %s 
                                    AND notes.counsilor_id=%s AND users.office_id IN ({}) AND study_abroad_destination IN ({})
                                    """

                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                countryOfIntrestJoinData = ', '.join(['%s'] * len(countryOfIntrests))

                sqlgetReminderReport = sqlgetReminderReport.format(officeIdJoinData, countryOfIntrestJoinData)

                query_params = [fromDate, toDate, userId] + officeIds + countryOfIntrests

            cursor.execute(sqlgetReminderReport, query_params)
            missedReport = cursor.fetchall()

            if missedReport:
                userMissedReminderReport = json.dumps(missedReport, default=str)
            else:
                userMissedReminderReport.append('No data found')
        except mysql.Error as e:
            userMissedReminderReport.append(str(e))
        finally:
            cursor.close()
        return userMissedReminderReport


class getApplicantReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        toDate = datetime.strptime(toDate, '%Y-%m-%d')
        toDate = toDate + timedelta(days=1)
        toDate = toDate.strftime('%Y-%m-%d')
        officeId = data["officeId"]
        officeIds = officeId.split(",")
        staffId = data["staffId"]
        staffIds = staffId.split(",")
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        applicantReport = []
        cursor = cnx.cursor()
        try:
            if "All" in officeIds and "All" in staffIds:
                sqlgetApplicantReport = """
                                    select COALESCE(users.name, 'No Counselor') AS counselor_name, 
                                    count(IF(students.counsilor_id IS NOT NULL, 1, 0)) as count, office_name, 
                                    users.user_id, students.office_id from students 
                                    left join users on students.counsilor_id=users.user_id 
                                    left join offices on offices.office_id=students.office_id
                                    WHERE students.created_date BETWEEN %s AND %s 
                                    group by students.counsilor_id, users.name, office_name, students.office_id
                                """

                query_params = [fromDate, toDate]
            elif "All" in officeIds and "All" not in staffIds:
                sqlgetApplicantReport = """
                                    select COALESCE(users.name, 'No Counselor') AS counselor_name, 
                                    count(IF(students.counsilor_id IS NOT NULL, 1, 0)) as count, office_name, 
                                    users.user_id, students.office_id from students 
                                    left join users on students.counsilor_id=users.user_id 
                                    left join offices on offices.office_id=students.office_id
                                    WHERE students.created_date BETWEEN %s AND %s AND students.counsilor_id IN ({}) 
                                    group by students.counsilor_id, users.name, office_name, students.office_id
                                    """
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))

                sqlgetApplicantReport = sqlgetApplicantReport.format(staffIdJoinData)

                query_params = [fromDate, toDate] + staffIds
            elif "All" not in officeIds and "All" in staffIds:
                sqlgetApplicantReport = """
                                    select COALESCE(users.name, 'No Counselor') AS counselor_name, 
                                    count(IF(students.counsilor_id IS NOT NULL, 1, 0)) as count, office_name, 
                                    users.user_id, students.office_id from students 
                                    left join users on students.counsilor_id=users.user_id 
                                    left join offices on offices.office_id=students.office_id
                                    WHERE students.created_date BETWEEN %s AND %s AND students.office_id IN ({}) 
                                    group by students.counsilor_id, users.name, office_name, students.office_id
                                """
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))

                sqlgetApplicantReport = sqlgetApplicantReport.format(officeIdJoinData)

                query_params = [fromDate, toDate] + officeIds
            else:
                sqlgetApplicantReport = """
                                    select COALESCE(users.name, 'No Counselor') AS counselor_name, 
                                    count(IF(students.counsilor_id IS NOT NULL, 1, 0)) as count, office_name, 
                                    users.user_id, students.office_id from students 
                                    left join users on students.counsilor_id=users.user_id 
                                    left join offices on offices.office_id=students.office_id
                                    WHERE students.created_date BETWEEN %s AND %s AND students.office_id IN ({}) 
                                    AND students.counsilor_id IN ({})
                                    group by students.counsilor_id, users.name, office_name, students.office_id
                                """

                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))

                sqlgetApplicantReport = sqlgetApplicantReport.format(officeIdJoinData, staffIdJoinData)

                query_params = [fromDate, toDate] + officeIds + staffIds

            cursor.execute(sqlgetApplicantReport, query_params)
            applicRprt = cursor.fetchall()

            if applicRprt:
                applicantReport = json.dumps(applicRprt, default=str)
            else:
                applicantReport.append('No data found')
        except mysql.Error as e:
            applicantReport.append(str(e))
        finally:
            cursor.close()
        return applicantReport


class getStudentList(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        toDate = datetime.strptime(toDate, '%Y-%m-%d')
        toDate = toDate + timedelta(days=1)
        toDate = toDate.strftime('%Y-%m-%d')
        officeId = data["officeId"]
        staffId = data["staffId"]
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        studentListDetails = []
        cursor = cnx.cursor()
        try:
            if staffId == "":
                sqlgetStudentList = """
                                                    select student_id, first_name, last_name, name, status from students 
                                                    left join users on users.user_id=students.counsilor_id
                                                    WHERE students.created_date BETWEEN %s AND %s AND students.office_id=%s
                                                    AND students.counsilor_id is null
                                                    """
                query_params = (fromDate, toDate, officeId)
            else:
                sqlgetStudentList = """
                                        select student_id, first_name, last_name, name, status from students 
                                        left join users on users.user_id=students.counsilor_id
                                        WHERE students.created_date BETWEEN %s AND %s AND students.office_id=%s
                                        AND students.counsilor_id=%s
                                        """
                query_params = (fromDate, toDate, officeId, staffId)

            cursor.execute(sqlgetStudentList, query_params)
            studList = cursor.fetchall()

            if studList:
                studentListDetails = json.dumps(studList, default=str)
            else:
                studentListDetails.append('No data found')
        except mysql.Error as e:
            studentListDetails.append(str(e))
        finally:
            cursor.close()
        return studentListDetails


class getStaffApplicationASDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        toDate = datetime.strptime(toDate, '%Y-%m-%d')
        toDate = toDate + timedelta(days=1)
        toDate = toDate.strftime('%Y-%m-%d')
        officeId = data["officeId"]
        officeIds = officeId.split(",")
        staffId = data["staffId"]
        staffIds = staffId.split(",")
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        stafApplicationASDReport = []
        cursor = cnx.cursor()
        try:
            if "All" in officeIds and "All" in staffIds:
                sqlgetStafApplicationASDReport = """
                                                select users.name, students.student_id, first_name, last_name, course_type, 
                                            institution_name, date_of_application_sent, course_start_date, offices.office_name from application 
                                            left join students on application.student_id=students.student_id 
                                            left join users on users.user_id=students.counsilor_id 
                                            left join offices on offices.office_id=users.office_id
                                            WHERE date_of_application_sent BETWEEN %s AND %s
                                            """
                query_params = [fromDate, toDate]

            elif "All" in officeIds and "All" not in staffIds:
                sqlgetStafApplicationASDReport = """
                                        select users.name, students.student_id, first_name, last_name, course_type, institution_name, 
                                        date_of_application_sent, course_start_date, offices.office_name from application 
                                        left join students on application.student_id=students.student_id 
                                        left join users on users.user_id=students.counsilor_id 
                                        left join offices on offices.office_id=users.office_id
                                        WHERE date_of_application_sent BETWEEN %s AND %s 
                                        AND students.counsilor_id IN ({})
                                        """
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))

                sqlgetStafApplicationASDReport = sqlgetStafApplicationASDReport.format(staffIdJoinData)

                query_params = [fromDate, toDate] + staffIds
            elif "All" not in officeIds and "All" in staffIds:
                sqlgetStafApplicationASDReport = """
                                        select users.name, students.student_id, first_name, last_name, course_type, institution_name, 
                                        date_of_application_sent, course_start_date, offices.office_name from application 
                                        left join students on application.student_id=students.student_id 
                                        left join users on users.user_id=students.counsilor_id 
                                        left join offices on offices.office_id=users.office_id
                                        WHERE date_of_application_sent BETWEEN %s AND %s 
                                        AND students.office_id IN ({})
                                        """
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))

                sqlgetStafApplicationASDReport = sqlgetStafApplicationASDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate] + officeIds
            else:
                sqlgetStafApplicationASDReport = """
                                        select users.name, students.student_id, first_name, last_name, course_type, institution_name, 
                                        date_of_application_sent, course_start_date, offices.office_name from application 
                                        left join students on application.student_id=students.student_id 
                                        left join users on users.user_id=students.counsilor_id 
                                        left join offices on offices.office_id=users.office_id
                                        WHERE date_of_application_sent BETWEEN %s AND %s 
                                        AND students.office_id IN ({}) AND students.counsilor_id IN ({})
                                        """

                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))

                sqlgetStafApplicationASDReport = sqlgetStafApplicationASDReport.format(officeIdJoinData,
                                                                                       staffIdJoinData)

                query_params = [fromDate, toDate] + officeIds + staffIds

            cursor.execute(sqlgetStafApplicationASDReport, query_params)
            applicationASDReport = cursor.fetchall()

            if applicationASDReport:
                stafApplicationASDReport = json.dumps(applicationASDReport, default=str)
            else:
                stafApplicationASDReport.append('No data found')
        except mysql.Error as e:
            stafApplicationASDReport.append(str(e))
        finally:
            cursor.close()
        return stafApplicationASDReport


class getStaffApplicationCSDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        toDate = datetime.strptime(toDate, '%Y-%m-%d')
        toDate = toDate + timedelta(days=1)
        toDate = toDate.strftime('%Y-%m-%d')
        officeId = data["officeId"]
        officeIds = officeId.split(",")
        staffId = data["staffId"]
        staffIds = staffId.split(",")
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        stafApplicationCSDReport = []
        cursor = cnx.cursor()
        try:
            if "All" in officeIds and "All" in staffIds:
                sqlgetStafApplicationCSDReport = """
                                                select users.name, students.student_id, first_name, last_name, course_type, 
                                            institution_name, date_of_application_sent, course_start_date, offices.office_name from application 
                                            left join students on application.student_id=students.student_id 
                                            left join users on users.user_id=students.counsilor_id 
                                            left join offices on offices.office_id=users.office_id
                                            WHERE course_start_date BETWEEN %s AND %s
                                            """
                query_params = [fromDate, toDate]

            elif "All" in officeIds and "All" not in staffIds:
                sqlgetStafApplicationCSDReport = """
                                        select users.name, students.student_id, first_name, last_name, course_type, institution_name, 
                                        date_of_application_sent, course_start_date, offices.office_name from application 
                                        left join students on application.student_id=students.student_id 
                                        left join users on users.user_id=students.counsilor_id 
                                        left join offices on offices.office_id=users.office_id
                                        WHERE course_start_date BETWEEN %s AND %s 
                                        AND students.counsilor_id IN ({})
                                        """
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))

                sqlgetStafApplicationCSDReport = sqlgetStafApplicationCSDReport.format(staffIdJoinData)

                query_params = [fromDate, toDate] + staffIds
            elif "All" not in officeIds and "All" in staffIds:
                sqlgetStafApplicationCSDReport = """
                                        select users.name, students.student_id, first_name, last_name, course_type, institution_name, 
                                        date_of_application_sent, course_start_date, offices.office_name from application 
                                        left join students on application.student_id=students.student_id 
                                        left join users on users.user_id=students.counsilor_id 
                                        left join offices on offices.office_id=users.office_id
                                        WHERE course_start_date BETWEEN %s AND %s 
                                        AND students.office_id IN ({})
                                        """
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))

                sqlgetStafApplicationCSDReport = sqlgetStafApplicationCSDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate] + officeIds
            else:
                sqlgetStafApplicationCSDReport = """
                                        select users.name, students.student_id, first_name, last_name, course_type, institution_name, 
                                        date_of_application_sent, course_start_date, offices.office_name from application 
                                        left join students on application.student_id=students.student_id 
                                        left join users on users.user_id=students.counsilor_id 
                                        left join offices on offices.office_id=users.office_id
                                        WHERE course_start_date BETWEEN %s AND %s 
                                        AND students.office_id IN ({}) AND students.counsilor_id IN ({})
                                        """

                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))

                sqlgetStafApplicationCSDReport = sqlgetStafApplicationCSDReport.format(officeIdJoinData,
                                                                                       staffIdJoinData)

                query_params = [fromDate, toDate] + officeIds + staffIds

            cursor.execute(sqlgetStafApplicationCSDReport, query_params)
            applicationCSDReport = cursor.fetchall()

            if applicationCSDReport:
                stafApplicationCSDReport = json.dumps(applicationCSDReport, default=str)
            else:
                stafApplicationCSDReport.append('No data found')
        except mysql.Error as e:
            stafApplicationCSDReport.append(str(e))
        finally:
            cursor.close()
        return stafApplicationCSDReport


class getStaffApplicationASDStaffCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        toDate = datetime.strptime(toDate, '%Y-%m-%d')
        toDate = toDate + timedelta(days=1)
        toDate = toDate.strftime('%Y-%m-%d')
        officeId = data["officeId"]
        officeIds = officeId.split(",")
        staffId = data["staffId"]
        staffIds = staffId.split(",")
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        stafApplicationASDStaffCount = []
        cursor = cnx.cursor()
        try:
            if "All" in officeIds and "All" in staffIds:
                sqlgetStafApplicationASDStaffCount = """
                                                select count(students.counsilor_id), name from application 
                                                left join students on application.student_id=students.student_id 
                                                left join users on users.user_id=students.counsilor_id
                                                WHERE date_of_application_sent BETWEEN %s AND %s 
                                                group by students.counsilor_id, name
                                                """
                query_params = [fromDate, toDate]

            elif "All" in officeIds and "All" not in staffIds:
                sqlgetStafApplicationASDStaffCount = """
                                                select count(students.counsilor_id), name from application 
                                                left join students on application.student_id=students.student_id 
                                                left join users on users.user_id=students.counsilor_id
                                                WHERE date_of_application_sent BETWEEN %s AND %s 
                                                AND students.counsilor_id IN ({})
                                                group by students.counsilor_id, name
                                                """
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))

                sqlgetStafApplicationASDStaffCount = sqlgetStafApplicationASDStaffCount.format(staffIdJoinData)

                query_params = [fromDate, toDate] + staffIds
            elif "All" not in officeIds and "All" in staffIds:
                sqlgetStafApplicationASDStaffCount = """
                                                select count(students.counsilor_id), name from application 
                                                left join students on application.student_id=students.student_id 
                                                left join users on users.user_id=students.counsilor_id
                                                WHERE date_of_application_sent BETWEEN %s AND %s 
                                                AND students.office_id IN ({})
                                                group by students.counsilor_id, name 
                                                """
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))

                sqlgetStafApplicationASDStaffCount = sqlgetStafApplicationASDStaffCount.format(officeIdJoinData)

                query_params = [fromDate, toDate] + officeIds
            else:
                sqlgetStafApplicationASDStaffCount = """
                                                select count(students.counsilor_id), name from application 
                                                left join students on application.student_id=students.student_id 
                                                left join users on users.user_id=students.counsilor_id
                                                WHERE date_of_application_sent BETWEEN %s AND %s 
                                                AND students.office_id IN ({}) AND students.counsilor_id IN ({})
                                                group by students.counsilor_id, name
                                                """

                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))

                sqlgetStafApplicationASDStaffCount = sqlgetStafApplicationASDStaffCount.format(officeIdJoinData,
                                                                                               staffIdJoinData)

                query_params = [fromDate, toDate] + officeIds + staffIds

            cursor.execute(sqlgetStafApplicationASDStaffCount, query_params)
            applicationASDStaffCount = cursor.fetchall()

            if applicationASDStaffCount:
                stafApplicationASDStaffCount = json.dumps(applicationASDStaffCount, default=str)
            else:
                stafApplicationASDStaffCount.append('No data found')
        except mysql.Error as e:
            stafApplicationASDStaffCount.append(str(e))
        finally:
            cursor.close()
        return stafApplicationASDStaffCount


class getStaffApplicationCSDStaffCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        toDate = datetime.strptime(toDate, '%Y-%m-%d')
        toDate = toDate + timedelta(days=1)
        toDate = toDate.strftime('%Y-%m-%d')
        officeId = data["officeId"]
        officeIds = officeId.split(",")
        staffId = data["staffId"]
        staffIds = staffId.split(",")
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        stafApplicationCSDStaffCount = []
        cursor = cnx.cursor()
        try:
            if "All" in officeIds and "All" in staffIds:
                sqlgetStafApplicationCSDStaffCount = """
                                                select count(students.counsilor_id), name from application 
                                                left join students on application.student_id=students.student_id 
                                                left join users on users.user_id=students.counsilor_id
                                                WHERE course_start_date BETWEEN %s AND %s 
                                                group by students.counsilor_id, name
                                                """
                query_params = [fromDate, toDate]

            elif "All" in officeIds and "All" not in staffIds:
                sqlgetStafApplicationCSDStaffCount = """
                                                select count(students.counsilor_id), name from application 
                                                left join students on application.student_id=students.student_id 
                                                left join users on users.user_id=students.counsilor_id
                                                WHERE course_start_date BETWEEN %s AND %s 
                                                AND students.counsilor_id IN ({})
                                                group by students.counsilor_id, name
                                                """
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))

                sqlgetStafApplicationCSDStaffCount = sqlgetStafApplicationCSDStaffCount.format(staffIdJoinData)

                query_params = [fromDate, toDate] + staffIds
            elif "All" not in officeIds and "All" in staffIds:
                sqlgetStafApplicationCSDStaffCount = """
                                                select count(students.counsilor_id), name from application 
                                                left join students on application.student_id=students.student_id 
                                                left join users on users.user_id=students.counsilor_id
                                                WHERE course_start_date BETWEEN %s AND %s 
                                                AND students.office_id IN ({})
                                                group by students.counsilor_id, name 
                                                """
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))

                sqlgetStafApplicationCSDStaffCount = sqlgetStafApplicationCSDStaffCount.format(officeIdJoinData)

                query_params = [fromDate, toDate] + officeIds
            else:
                sqlgetStafApplicationCSDStaffCount = """
                                                select name, count(students.counsilor_id) from application 
                                                left join students on application.student_id=students.student_id 
                                                left join users on users.user_id=students.counsilor_id
                                                WHERE course_start_date BETWEEN %s AND %s 
                                                AND students.office_id IN ({}) AND students.counsilor_id IN ({})
                                                group by students.counsilor_id, name
                                                """

                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                staffIdJoinData = ', '.join(['%s'] * len(staffIds))

                sqlgetStafApplicationCSDStaffCount = sqlgetStafApplicationCSDStaffCount.format(officeIdJoinData,
                                                                                               staffIdJoinData)

                query_params = [fromDate, toDate] + officeIds + staffIds

            cursor.execute(sqlgetStafApplicationCSDStaffCount, query_params)
            applicationCSDStaffCount = cursor.fetchall()

            if applicationCSDStaffCount:
                stafApplicationCSDStaffCount = json.dumps(applicationCSDStaffCount, default=str)
            else:
                stafApplicationCSDStaffCount.append('No data found')
        except mysql.Error as e:
            stafApplicationCSDStaffCount.append(str(e))
        finally:
            cursor.close()
        return stafApplicationCSDStaffCount


class getNote(Resource):
    def post(self):
        data = request.get_json(force=True)
        noteId = data["noteId"]
        notes = []

        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectNote = """SELECT contact_type, lead_source, note, reminder_date, note_id FROM notes WHERE note_id=%s"""
            value = (noteId,)
            cursor.execute(sqlSelectNote, value)
            notes_data = cursor.fetchall()
            if notes_data:
                notes = json.dumps(notes_data, default=str)
            else:
                notes.append('No data found')
        except mysql.Error as e:
            notes.append(str(e))
        finally:
            cursor.close()

        return notes


class updateStudentNotes(Resource):
    def post(self):
        data = request.get_json(force=True)
        noteId = data["noteId"]
        note = data["note"]
        reminderDate = data["reminderDate"]
        contactType = data["contactType"]
        leadSource = data["leadSource"]
        if (reminderDate == ""):
            status = 0;
        else:
            status = 1
        updateNoteMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlUpdateNote = """update notes set contact_type=%s, lead_source=%s, note=%s, reminder_date=%s, status=%s 
                            where note_id=%s """
            value = (contactType, leadSource, note, reminderDate, status, noteId,)
            cursor.execute(sqlUpdateNote, value)
            updateNoteMsg.append("Sucessfully Updated the Note")

        except mysql.Error as e:
            updateNoteMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return updateNoteMsg


class reAssignStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        counsilorId = data["counsilorId"]
        studentId = data["studentId"]
        studentIds = studentId.split(",")
        userId = data["userId"]

        reAssignMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            placeholders = ', '.join(['%s'] * len(studentIds))
            for studentId in studentIds:
                sqlGetOldCounsellor = f"SELECT counsilor_id FROM students WHERE student_id IN ({placeholders})"

                # Execute the query with the tuple of studentIds
                cursor.execute(sqlGetOldCounsellor, studentIds)
                counsellorDetails = cursor.fetchall()

                # Check if there are results and print each councillor_id
                if counsellorDetails:
                    for counsellorDetail in counsellorDetails:
                        counsellor_id_old = counsellorDetail[0]
                        sqlGetOldCounselorName = """select name, username from users where user_id=%s"""
                        value = (counsellor_id_old,)
                        cursor.execute(sqlGetOldCounselorName, value)
                        counselorDetailOld = cursor.fetchone()
                        counselorNameOld = counselorDetailOld[0]
                        counselorMailOld = counselorDetailOld[1]
                sqlGetOldOffice = f"SELECT S.office_id,O.office_name FROM students S INNER JOIN offices O ON S.office_id = O.office_id WHERE student_id in ({placeholders})"
                value = tuple(studentIds)
                cursor.execute(sqlGetOldOffice, value)
                officeDetailsOld = cursor.fetchall()
                if officeDetailsOld:
                    for officeDetailOld in officeDetailsOld:
                        old_office_id = officeDetailOld[0]
                        old_office_name = officeDetailOld[1]
                cursor.execute(
                    "SELECT office_name FROM offices WHERE office_id = %s",
                    (officeId,))
                office_name = cursor.fetchone()[0]
                sqlGetCounselorName = """select name, username from users where user_id=%s"""
                value = (counsilorId,)
                cursor.execute(sqlGetCounselorName, value)
                counselorDetail = cursor.fetchone()
                counselorName = counselorDetail[0]
                counselorMail = counselorDetail[1]

                sqlAddNote = """INSERT INTO notes(student_id, counsilor_id, note, contact_type, lead_source)
                                            VALUES (%s, %s, %s, %s, %s)"""
                noteAddValue = (
                    studentId, userId,
                    f"Reassigned from {old_office_name}-{counselorNameOld} to {office_name}-{counselorName}",
                    "Bulk Reassigning", "")
                cursor.execute(sqlAddNote, noteAddValue)

            sqlUpdateNote = (
                "update students set office_id=%s, counsilor_id=%s where student_id in ({})".format(
                    ','.join(['%s'] * len(studentIds)))
            )
            value = [officeId, counsilorId] + studentIds
            cursor.execute(sqlUpdateNote, value)
            reAssignMsg.append("Students are Reassigned")

            sqlGetStudent = "select first_name, last_name, student_id from students where student_id in ({})".format(
                ','.join(['%s'] * len(studentIds)))
            cursor.execute(sqlGetStudent, studentIds)
            studentDetail = cursor.fetchall()

            students = ""
            for row in studentDetail:
                first_name, last_name, student_id = row
                students += f"Student Name: {first_name} {last_name}, Student Id: {student_id} <br>"

            sqlGetCounselorName = """select name, username from users where user_id=%s"""
            value = (counsilorId,)
            cursor.execute(sqlGetCounselorName, value)
            counselorDetail = cursor.fetchone()
            counselorName = counselorDetail[0]
            counselorMail = counselorDetail[1]

            htmlContent = f"<p>Hi {counselorName},</p><p>You have been assigned new students</p><p>{students}</p>" \
                          f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
            sendMail('New Student Assigned', htmlContent, counselorMail)

            sqlGetManager = """select name, username, office_id from users where office_id=%s and role=%s AND username != 'rajindersingh@uan-networks.com'"""
            value = (officeId, "manager",)
            cursor.execute(sqlGetManager, value)
            managerDetails = cursor.fetchall()
            if (managerDetails):
                for managerDetail in managerDetails:
                    managerName = managerDetail[0]
                    managerMail = managerDetail[1]
                    managerOfficeId = managerDetail[2]
                    if managerOfficeId != officeId:
                        htmlContent = f"<p>Hi {managerName},</p><p>Your office has been assigned new students</p>" \
                                      f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
                        sendMail('New Student Added', htmlContent, managerMail)
            reAssignMsg.append('Sucessfully Sent Email')

        except mysql.Error as e:
            reAssignMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return reAssignMsg


class getCounsilorAllStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        counsilorId = data["counsilorId"]
        students = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetStudents = """select student_id, first_name, last_name, students.email, mobile_no, dob, name, 
                                office_name from students 
                                left outer join users on students.counsilor_id=users.user_id
                                left outer join offices on students.office_id=offices.office_id 
                                where counsilor_id=%s"""
            value = (counsilorId,)
            cursor.execute(sqlGetStudents, value)
            studentsList = cursor.fetchall()
            if studentsList:
                students = json.dumps(studentsList, default=str)
            else:
                students.append('No data found')
        except mysql.Error as e:
            students.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return students


class getOfficeStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        officeStudents = []
        cursor = cnx.cursor()
        try:
            sqlSelectCounsilor = """select student_id, first_name, last_name, students.email, mobile_no, dob, name, 
                                office_name from students 
                                left outer join users on students.counsilor_id=users.user_id
                                left outer join offices on students.office_id=offices.office_id 
                                where students.office_id=%s"""
            value = (officeId,)
            cursor.execute(sqlSelectCounsilor, value)
            office_students = cursor.fetchall()
            if office_students:
                officeStudents = json.dumps(office_students, default=str)
            else:
                officeStudents.append('No data found')

        except mysql.Error as e:
            officeStudents.append(str(e))
        finally:
            cursor.close()
        return officeStudents


class getOfficeAllCounsilors(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        officeCounsilors = []
        cursor = cnx.cursor()
        try:
            sqlSelectCounsilor = """select user_id, users.office_id, username, name, role, count(students.counsilor_id) as studentCount, 
                                    deactivate from users 
                                    left outer join students on users.user_id=students.counsilor_id 
                                    where users.office_id=%s 
                                    group by students.counsilor_id, user_id"""
            value = (officeId,)
            cursor.execute(sqlSelectCounsilor, value)
            officeCounsilor = cursor.fetchall()
            if officeCounsilor:
                officeCounsilors = json.dumps(officeCounsilor, default=str)
            else:
                officeCounsilors.append('No data found')

        except mysql.Error as e:
            officeCounsilors.append(str(e))
        finally:
            cursor.close()
        return officeCounsilors


class getCounsilorCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        counsilorId = data["counsilorId"]
        counsilorIds = counsilorId.split(",")
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        counsilorsStudentCount = []
        cursor = cnx.cursor()
        try:
            sqlGetStaffCount = """select count(counsilor_id), counsilor_id from students where counsilor_id IN ({}) group by counsilor_id"""

            counsilorIdJoinData = ', '.join(['%s'] * len(counsilorIds))
            formatted_query = sqlGetStaffCount.format(counsilorIdJoinData)

            cursor.execute(formatted_query, counsilorIds)
            counsilorCount = cursor.fetchall()
            if counsilorCount:
                counsilorsStudentCount = json.dumps(counsilorCount, default=str)
            else:
                counsilorsStudentCount.append('No data found')

        except mysql.Error as e:
            counsilorsStudentCount.append(str(e))
        finally:
            cursor.close()
        return counsilorsStudentCount


class reAssignCounselors(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        counsilorId = data["counsilorId"]
        counsilorIds = counsilorId.split(",")

        reAssignMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlUpdateCounselor = (
                "update users set office_id=%s where user_id in ({})".format(','.join(['%s'] * len(counsilorIds)))
            )
            value = [officeId] + counsilorIds
            cursor.execute(sqlUpdateCounselor, value)
            reAssignMsg.append("Counselors are Reassigned")

        except mysql.Error as e:
            reAssignMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return reAssignMsg


class activateUser(Resource):
    def post(self):
        data = request.get_json(force=True)
        userId = data["userId"]

        userDelete = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlDeleteUser = """update users set deactivate=%s where user_id=%s"""
            value = (0, userId,)
            cursor.execute(sqlDeleteUser, value)
            userDelete.append('Staff Activated')
        except mysql.Error as e:
            userDelete.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return userDelete


class activateOffice(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]

        officeList = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlDeleteOffice = """update offices set deactivate=%s where office_id=%s"""
            value = (0, officeId,)
            cursor.execute(sqlDeleteOffice, value)
            officeList.append('Office Activated')
        except mysql.Error as e:
            officeList.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return officeList


class getUserReminderNotes(Resource):
    def post(self):
        data = request.get_json(force=True)
        userId = data["userId"]
        notes = []

        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectNote = """select note_id, student_id, note, reminder_date, created_date, status from notes 
                            where reminder_date IS NOT NULL AND status=1 AND counsilor_id=%s"""
            value = (userId,)
            cursor.execute(sqlSelectNote, value)
            notes_data = cursor.fetchall()
            if notes_data:
                notes = json.dumps(notes_data, default=str)
            else:
                notes.append('No data found')
        except mysql.Error as e:
            notes.append(str(e))
        finally:
            cursor.close()

        return notes


class addInstitution(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionName = data["institutionName"]
        institutionType = data["institutionType"]
        email = data["email"]
        invoiceMail = data["invoiceMail"]
        homePage = data["homePage"]
        country = data["country"]
        territory = data["territory"]
        commissionRate = data["commissionRate"]
        validFrom = data["validFrom"]
        validUntil = data["validUntil"]
        bonus = data["bonus"]
        applicationMethod = data["applicationMethod"]
        agentPortalDetails = data["agentPortalDetails"]
        courseType = data["courseType"]
        restrictionNotes = data["restrictionNotes"]
        commissionable = data["commissionable"]

        institution = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlAddInstitution = """insert into institution (institution_name,institution_type, email, home_page, country, teritory, 
                            commission_rate, bonus, application_method, agent_portal_details, course_type, restriction_notes, 
                            validFrom, validUntil, invoiceMail, commissionable) 
                            values (%s,%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            value = (institutionName, institutionType, email, homePage, country, territory, commissionRate, bonus,
                     applicationMethod,
                     agentPortalDetails, courseType, restrictionNotes, validFrom, validUntil, invoiceMail,
                     commissionable,)
            cursor.execute(sqlAddInstitution, value)
            institution.append('Institution Added')
        except mysql.Error as e:
            institution.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institution


class getInstitution(Resource):
    def get(self):
        institutions = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetInstitutions = """SELECT institution_id, institution_name, institution_type, email, home_page, country, teritory,
                            commission_rate, bonus, application_method, agent_portal_details, course_type, restriction_notes, validFrom, 
                            validUntil, invoiceMail, commissionable FROM institution"""
            cursor.execute(sqlGetInstitutions)
            institutions_data = cursor.fetchall()
            if institutions_data:
                institutions = json.dumps(institutions_data, default=str)
            else:
                institutions.append('No data found')
        except mysql.Error as e:
            institutions.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institutions


class getInstitutionWithId(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionId = data["institutionId"]
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetInstitutions = """SELECT institution_id, institution_name, institution_type, email, home_page, country, teritory,
                            commission_rate, bonus, application_method, agent_portal_details, course_type, restriction_notes,
                            validFrom, validUntil, invoiceMail, commissionable 
                            FROM institution where institution_id=%s"""
            value = (institutionId,)
            cursor.execute(sqlGetInstitutions, value)
            institutions_data = cursor.fetchall()
            if institutions_data:
                institutions = json.dumps(institutions_data, default=str)
            else:
                institutions.append('No data found')
        except mysql.Error as e:
            institutions.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institutions


class getInstitutionsName(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionType = data["institutionType"]
        country = data["country"]
        institutions = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if institutionType == "" and country == "":
                sqlGetInstitutions = """SELECT institution_id, institution_name FROM institution"""
                value = (institutionType, country,)
            elif country == "" and institutionType != "":
                if institutionType == "All":
                    sqlGetInstitutions = """SELECT institution_id, institution_name FROM institution"""
                    value = ()
                else:
                    sqlGetInstitutions = """SELECT institution_id, institution_name FROM institution where institution_type=%s"""
                    value = (institutionType,)
            elif institutionType == "" and country != "":
                sqlGetInstitutions = """SELECT institution_id, institution_name FROM institution where country=%s"""
                value = (country,)
            else:
                if institutionType == "All":
                    sqlGetInstitutions = """SELECT institution_id, institution_name FROM institution where country=%s"""
                    value = (country,)
                else:
                    sqlGetInstitutions = """SELECT institution_id, institution_name FROM institution where institution_type=%s AND country=%s"""
                    value = (institutionType, country,)
            cursor.execute(sqlGetInstitutions, value)
            institutions_data = cursor.fetchall()
            if institutions_data:
                institutions = json.dumps(institutions_data, default=str)
            else:
                institutions.append('No data found')
        except mysql.Error as e:
            institutions.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institutions


class getInstitutionProfile(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionId = data["institutionId"]
        institutionType = data["institutionType"]
        country = data["country"]
        institution = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if institutionType == "All":
                sqlGetInstitutions = """SELECT institution_id, institution_name, institution_type, email, home_page, country, teritory, 
                                                commission_rate, bonus, application_method, agent_portal_details, course_type, restriction_notes, 
                                                contract_files, validFrom, validUntil, invoiceMail, commissionable FROM institution 
                                                where institution_id=%s AND country=%s """
                value = (institutionId, country,)
            else:
                sqlGetInstitutions = """SELECT institution_id, institution_name, institution_type, email, home_page, country, teritory, 
                                    commission_rate, bonus, application_method, agent_portal_details, course_type, restriction_notes, 
                                    contract_files, validFrom, validUntil, invoiceMail, commissionable FROM institution 
                                    where institution_type=%s AND institution_id=%s AND country=%s """
                value = (institutionType, institutionId, country,)
            cursor.execute(sqlGetInstitutions, value)
            institution_profile = cursor.fetchall()
            if institution_profile:
                institution = json.dumps(institution_profile, default=str)
            else:
                institution.append('No data found')
        except mysql.Error as e:
            institution.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institution


class getCountryInstitutionProfile(Resource):
    def post(self):
        data = request.get_json(force=True)
        country = data["country"]
        countries = country.split(",")
        institution = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in countries:
                sqlGetInstitutions = """SELECT institution_id, institution_name, institution_type, email, home_page, country, teritory, 
                                                    commission_rate, bonus, application_method, agent_portal_details, course_type, restriction_notes, 
                                                    validFrom, validUntil, invoiceMail, commissionable
                                                    FROM institution """
                query_params = ()
            else:
                sqlGetInstitutions = """SELECT institution_id, institution_name, institution_type, email, home_page, country, teritory, 
                                    commission_rate, bonus, application_method, agent_portal_details, course_type, restriction_notes,
                                    validFrom, validUntil, invoiceMail, commissionable 
                                    FROM institution 
                                    where country in ({}) """
                countryJoinData = ', '.join(['%s'] * len(countries))

                sqlGetInstitutions = sqlGetInstitutions.format(countryJoinData)

                query_params = [] + countries
            cursor.execute(sqlGetInstitutions, query_params)
            institution_profile = cursor.fetchall()
            if institution_profile:
                institution = json.dumps(institution_profile, default=str)
            else:
                institution.append('No data found')
        except mysql.Error as e:
            institution.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institution


class updateInstitutionProfile(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionId = data["institutionId"]
        institutionName = data["institutionName"]
        institutionType = data["institutionType"]
        email = data["email"]
        homePage = data["homePage"]
        country = data["country"]
        territory = data["territory"]
        commissionRate = data["commissionRate"]
        bonus = data["bonus"]
        applicationMethod = data["applicationMethod"]
        agentPortalDetails = data["agentPortalDetails"]
        courseType = data["courseType"]
        restrictionNotes = data["restrictionNotes"]
        validFrom = data["validFrom"]
        validUntil = data["validUntil"]
        invoiceMail = data["invoiceMail"]
        commissionable = data["commissionable"]

        institution = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlUpdateInstitution = """update institution set institution_name=%s,institution_type=%s, email=%s, home_page=%s, 
                            country=%s, teritory=%s, commission_rate=%s, bonus=%s, application_method=%s, agent_portal_details=%s, 
                            course_type=%s, restriction_notes=%s, validFrom=%s, validUntil=%s, invoiceMail=%s, commissionable=%s
                            where institution_id=%s"""
            value = (institutionName, institutionType, email, homePage, country, territory, commissionRate, bonus,
                     applicationMethod,
                     agentPortalDetails, courseType, restrictionNotes, validFrom, validUntil, invoiceMail,
                     commissionable,
                     institutionId,)
            cursor.execute(sqlUpdateInstitution, value)
            institution.append('Institution Updated')
        except mysql.Error as e:
            institution.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institution


class updateContractFiles(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionId = data["institutionId"]
        contractFiles = data["contractFiles"]

        institution = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlUpdateInstitution = """update institution set contract_files=%s where institution_id=%s"""
            value = (contractFiles, institutionId,)
            cursor.execute(sqlUpdateInstitution, value)
            institution.append('Contract Files Updated')
        except mysql.Error as e:
            institution.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institution


class getApplicationsInstitutionProfileASDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionId = data["institutionId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        institution = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, course_name, first_name, last_name, office_name, 
                                    name, date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                    students.email, lead_source, utm_source FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON offices.office_id = students.office_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND institution_id=%s"""
                query_params = [fromDate, toDate, institutionId, ]
            else:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, course_name, first_name, last_name, office_name, 
                                    name, date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                    students.email, lead_source, utm_source FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON offices.office_id = students.office_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND institution_id=%s
                                    AND students.office_id IN ({})"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, institutionId] + officeIds
            cursor.execute(sqlSelectASDReport, query_params)
            institution_profile = cursor.fetchall()
            if institution_profile:
                institution = json.dumps(institution_profile, default=str)
            else:
                institution.append('No data found')
        except mysql.Error as e:
            institution.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institution


class getApplicationsInstitutionProfileCSDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionId = data["institutionId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        institution = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, course_name, first_name, last_name, office_name, 
                                    name, date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                    students.email, lead_source, utm_source FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON offices.office_id = students.office_id
                                    WHERE course_start_date BETWEEN %s AND %s AND institution_id=%s"""
                query_params = [fromDate, toDate, institutionId, ]
            else:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, course_name, first_name, last_name, office_name, 
                                    name, date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                    students.email, lead_source, utm_source FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON offices.office_id = students.office_id
                                    WHERE course_start_date BETWEEN %s AND %s AND institution_id=%s
                                    AND students.office_id IN ({})"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, institutionId] + officeIds
            cursor.execute(sqlSelectCSDReport, query_params)
            institution_profile = cursor.fetchall()
            if institution_profile:
                institution = json.dumps(institution_profile, default=str)
            else:
                institution.append('No data found')
        except mysql.Error as e:
            institution.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institution


class getApplicationsInstitutionProfileYearCountCSDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionId = data["institutionId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        institution = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectCSDReport = """
                                    SELECT year(course_start_date) as year, COUNT(application_id) AS application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                    SUM(CASE WHEN offer_decision_type Is Null THEN 1 ELSE 0 END) AS pending_application_count FROM application 
                                    where application.course_start_date BETWEEN %s AND %s AND institution_id=%s
                                    group by year(course_start_date) order by year(course_start_date) desc"""
                query_params = [fromDate, toDate, institutionId, ]
            else:
                sqlSelectCSDReport = """
                                    SELECT year(course_start_date) as year, COUNT(application_id) AS application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                    SUM(CASE WHEN offer_decision_type Is Null THEN 1 ELSE 0 END) AS pending_application_count FROM application  
                                    left outer join students on application.student_id=students.student_id 
                                    where application.course_start_date BETWEEN %s AND %s AND students.office_id IN ({}) AND institution_id=%s
                                    group by year(course_start_date) order by year(course_start_date) desc"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, institutionId] + officeIds
            cursor.execute(sqlSelectCSDReport, query_params)
            institution_profile = cursor.fetchall()
            if institution_profile:
                institution = json.dumps(institution_profile, default=str)
            else:
                institution.append('No data found')
        except mysql.Error as e:
            institution.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institution


class getApplicationsInstitutionProfileYearCountASDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionId = data["institutionId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        institution = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectASDReport = """
                                    SELECT year(course_start_date) as year, COUNT(application_id) AS application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                    SUM(CASE WHEN offer_decision_type Is Null THEN 1 ELSE 0 END) AS pending_application_count FROM application 
                                    where application.date_of_application_sent BETWEEN %s AND %s AND institution_id=%s
                                    group by year(course_start_date) order by year(course_start_date) desc"""
                query_params = [fromDate, toDate, institutionId, ]
            else:
                sqlSelectASDReport = """
                                    SELECT year(course_start_date) as year, COUNT(application_id) AS application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                    SUM(CASE WHEN offer_decision_type Is Null THEN 1 ELSE 0 END) AS pending_application_count FROM application  
                                    left outer join students on application.student_id=students.student_id 
                                    where application.date_of_application_sent BETWEEN %s AND %s AND students.office_id IN ({}) AND institution_id=%s
                                    group by year(course_start_date) order by year(course_start_date) desc"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, institutionId] + officeIds
            cursor.execute(sqlSelectASDReport, query_params)
            institution_profile = cursor.fetchall()
            if institution_profile:
                institution = json.dumps(institution_profile, default=str)
            else:
                institution.append('No data found')
        except mysql.Error as e:
            institution.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institution


class getFinalChoicesInstitutionProfileASDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionId = data["institutionId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        institution = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectASDReport = """SELECT students.student_id AS student_id, first_name, last_name, students.email, 
                                    nationality, office_name, application.course_type, course_name, name, course_start_date, 
                                    tution_fee, institution.commission_rate, utm_source, utm_medium, utm_campaign, lead_source,
                                    invoiceNo, invoiceSent, paidToUs, application_id FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN institution ON application.institution_id = institution.institution_id 
                                    LEFT OUTER JOIN offices ON students.office_id = offices.office_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND application.institution_id=%s AND final_choiced=1"""
                query_params = [fromDate, toDate, institutionId, ]
            else:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, students.email, 
                                    nationality, office_name, application.course_type, course_name, name, course_start_date, 
                                    tution_fee, commission_rate, utm_source, utm_medium, utm_campaign, lead_source,
                                    invoiceNo, invoiceSent, paidToUs, application_id FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN institution ON application.institution_id = institution.institution_id 
                                    LEFT OUTER JOIN offices ON students.office_id = offices.office_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND application.institution_id=%s
                                    AND students.office_id IN ({}) AND final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, institutionId] + officeIds
            cursor.execute(sqlSelectASDReport, query_params)
            institution_profile = cursor.fetchall()
            if institution_profile:
                institution = json.dumps(institution_profile, default=str)
            else:
                institution.append('No data found')
        except mysql.Error as e:
            institution.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institution


class getFinalChoicessInstitutionProfileCSDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionId = data["institutionId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        institution = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectCSDReport = """SELECT students.student_id AS student_id, first_name, last_name, students.email, 
                                    nationality, office_name, application.course_type, course_name, name, course_start_date, 
                                    tution_fee, institution.commission_rate, utm_source, utm_medium, utm_campaign, lead_source,
                                    invoiceNo, invoiceSent, paidToUs, application_id FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN institution ON application.institution_id = institution.institution_id 
                                    LEFT OUTER JOIN offices ON students.office_id = offices.office_id
                                    WHERE course_start_date BETWEEN %s AND %s AND application.institution_id=%s AND final_choiced=1"""
                query_params = [fromDate, toDate, institutionId, ]
            else:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, students.email, 
                                    nationality, office_name, application.course_type, course_name, name, course_start_date, 
                                    tution_fee, commission_rate, utm_source, utm_medium, utm_campaign, lead_source,
                                    invoiceNo, invoiceSent, paidToUs, application_id FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN institution ON application.institution_id = institution.institution_id 
                                    LEFT OUTER JOIN offices ON students.office_id = offices.office_id
                                    WHERE course_start_date BETWEEN %s AND %s AND application.institution_id=%s
                                    AND students.office_id IN ({}) AND final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, institutionId] + officeIds
            cursor.execute(sqlSelectCSDReport, query_params)
            institution_profile = cursor.fetchall()
            if institution_profile:
                institution = json.dumps(institution_profile, default=str)
            else:
                institution.append('No data found')
        except mysql.Error as e:
            institution.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institution


class getFinalChoicesInstitutionCourseTypeASDCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionId = data["institutionId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        institution = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectASDReport = """SELECT COUNT(*) AS total_count, COUNT(CASE WHEN course_type = 'Postgraduate' THEN 1 END) AS pg_count, 
                                    COUNT(CASE WHEN course_type = 'Undergraduate' THEN 1 END) AS ug_count, 
                                    COUNT(CASE WHEN course_type = 'Pathways Follow on' THEN 1 END) AS pathways_follow_count, 
                                    COUNT(CASE WHEN course_type = 'Year 2 Follow on' THEN 1 END) AS Y2_count, 
                                    COUNT(CASE WHEN course_type = 'Year 3 Follow on' THEN 1 END) AS Y3_count, 
                                    COUNT(CASE WHEN course_type = 'Pre-Sessional' THEN 1 END) AS preSess_count, 
                                    SUM(CASE WHEN course_type IN ('Pre-Masters', 'Foundation', 'Phd', 'Summer School') THEN 1 ELSE 0 END) AS other_count 
                                    FROM application 
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND institution_id=%s AND final_choiced=1"""
                query_params = [fromDate, toDate, institutionId, ]
            else:
                sqlSelectASDReport = """
                                    SELECT COUNT(*) AS total_count, COUNT(CASE WHEN course_type = 'Postgraduate' THEN 1 END) AS pg_count, 
                                    COUNT(CASE WHEN course_type = 'Undergraduate' THEN 1 END) AS ug_count, 
                                    COUNT(CASE WHEN course_type = 'Pathways Follow on' THEN 1 END) AS pathways_follow_count, 
                                    COUNT(CASE WHEN course_type = 'Year 2 Follow on' THEN 1 END) AS Y2_count, 
                                    COUNT(CASE WHEN course_type = 'Year 3 Follow on' THEN 1 END) AS Y3_count, 
                                    COUNT(CASE WHEN course_type = 'Pre-Sessional' THEN 1 END) AS preSess_count, 
                                    SUM(CASE WHEN course_type IN ('Pre-Masters', 'Foundation', 'Phd', 'Summer School') THEN 1 ELSE 0 END) AS other_count 
                                    FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND institution_id=%s
                                    AND students.office_id IN ({}) AND final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, institutionId] + officeIds
            cursor.execute(sqlSelectASDReport, query_params)
            institution_profile = cursor.fetchall()
            if institution_profile:
                institution = json.dumps(institution_profile, default=str)
            else:
                institution.append('No data found')
        except mysql.Error as e:
            institution.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institution


class getFinalChoicesInstitutionCourseTypeCSDCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionId = data["institutionId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        institution = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectCSDReport = """SELECT COUNT(*) AS total_count, COUNT(CASE WHEN course_type = 'Postgraduate' THEN 1 END) AS pg_count, 
                                    COUNT(CASE WHEN course_type = 'Undergraduate' THEN 1 END) AS ug_count, 
                                    COUNT(CASE WHEN course_type = 'Pathways Follow on' THEN 1 END) AS pathways_follow_count, 
                                    COUNT(CASE WHEN course_type = 'Year 2 Follow on' THEN 1 END) AS Y2_count, 
                                    COUNT(CASE WHEN course_type = 'Year 3 Follow on' THEN 1 END) AS Y3_count, 
                                    COUNT(CASE WHEN course_type = 'Pre-Sessional' THEN 1 END) AS preSess_count, 
                                    SUM(CASE WHEN course_type IN ('Pre-Masters', 'Foundation', 'Phd', 'Summer School') THEN 1 ELSE 0 END) AS other_count 
                                    FROM application 
                                    WHERE course_start_date BETWEEN %s AND %s AND institution_id=%s AND final_choiced=1"""
                query_params = [fromDate, toDate, institutionId, ]
            else:
                sqlSelectCSDReport = """
                                    SELECT COUNT(*) AS total_count, COUNT(CASE WHEN course_type = 'Postgraduate' THEN 1 END) AS pg_count, 
                                    COUNT(CASE WHEN course_type = 'Undergraduate' THEN 1 END) AS ug_count, 
                                    COUNT(CASE WHEN course_type = 'Pathways Follow on' THEN 1 END) AS pathways_follow_count, 
                                    COUNT(CASE WHEN course_type = 'Year 2 Follow on' THEN 1 END) AS Y2_count, 
                                    COUNT(CASE WHEN course_type = 'Year 3 Follow on' THEN 1 END) AS Y3_count, 
                                    COUNT(CASE WHEN course_type = 'Pre-Sessional' THEN 1 END) AS preSess_count, 
                                    SUM(CASE WHEN course_type IN ('Pre-Masters', 'Foundation', 'Phd', 'Summer School') THEN 1 ELSE 0 END) AS other_count 
                                    FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    WHERE course_start_date BETWEEN %s AND %s AND institution_id=%s
                                    AND students.office_id IN ({}) AND final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, institutionId] + officeIds
            cursor.execute(sqlSelectCSDReport, query_params)
            institution_profile = cursor.fetchall()
            if institution_profile:
                institution = json.dumps(institution_profile, default=str)
            else:
                institution.append('No data found')
        except mysql.Error as e:
            institution.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institution


class contractFileUpload(Resource):
    def post(self):
        file = request.files["file"]
        institutionId = request.form["institutionId"]
        filename = secure_filename(file.filename)
        uploadFile = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            file.save(os.path.join(CONTRACT_FOLDER, filename))
            uploadFile.append('File uploaded Successfully\n')
            try:
                sqlAddContractFile = """insert into contract (contract_file, institution_id) values (%s, %s)"""
                value = (filename, institutionId,)
                cursor.execute(sqlAddContractFile, value)
                last_insert_id = cursor.lastrowid
                uploadFile.append('File Added')
                uploadFile.append(last_insert_id)
            except mysql.Error as e:
                uploadFile.append(str(e))
            finally:
                cnx.commit()
                cursor.close()
        except OSError as e:
            uploadFile.append(str(e))

        return uploadFile


class getContractFile(Resource):
    def post(self):
        data = request.get_json(force=True)
        fileName = data["fileName"]
        fileType = ""
        try:
            base64_files = []  # Initialize a list to store the Base64-encoded images
            file_path = os.path.join(CONTRACT_FOLDER, fileName)

            # Check if the file exists
            image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tif', '.tiff'}
            if os.path.exists(file_path) and os.path.splitext(file_path)[1].lower() in image_extensions:
                with open(file_path, 'rb') as image_file:
                    image_contents = image_file.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_image = base64.b64encode(image_contents).decode('utf-8')
                    base64_files.append(base64_image)
                fileType = "image"
            elif os.path.exists(file_path) and os.path.splitext(file_path)[1].lower() == '.pdf':
                # Open and read the file
                with open(file_path, 'rb') as file_to_read:
                    file_contents = file_to_read.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_pdf = base64.b64encode(file_contents).decode('utf-8')
                    base64_files.append(base64_pdf)
                fileType = "pdf"
            elif os.path.exists(file_path) and (os.path.splitext(file_path)[1].lower() == '.xlsx'
                                                or os.path.splitext(file_path)[1].lower() == '.xls'):
                # Open and read the Excel file
                with open(file_path, 'rb') as excel_file:
                    excel_contents = excel_file.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_excel = base64.b64encode(excel_contents).decode('utf-8')
                    base64_files.append(base64_excel)
                fileType = "xl"
            elif os.path.exists(file_path) and os.path.splitext(file_path)[1].lower() == '.csv':
                # Open and read the CSV file
                with open(file_path, 'rb') as csv_file:
                    csv_contents = csv_file.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_csv = base64.b64encode(csv_contents).decode('utf-8')
                    base64_files.append(base64_csv)
                fileType = "csv"
            else:
                base64_files.append('')
                fileType = ""
        except mysql.Error as e:
            staffDet.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return [base64_files, fileType]


class getCommissionDetails(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionId = data["institutionId"]
        commission_datas = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetCommissionDetails = """SELECT commission_rate_id, course_type, course_name, valid_from, valid_until, min_num, 
                                        max_num, commission, institution_id, territory FROM commission_rate where institution_id=%s and status=0"""
            value = (institutionId,)
            cursor.execute(sqlGetCommissionDetails, value)
            commission_data = cursor.fetchall()
            if commission_data:
                commission_datas = json.dumps(commission_data, default=str)
            else:
                commission_datas.append('No data found')
        except mysql.Error as e:
            commission_datas.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return commission_datas


class addInstitutionNotes(Resource):
    def post(self):
        data = request.get_json(force=True)
        staffId = data["staffId"]
        institutionId = data["institutionId"]
        note = data["note"]
        noteAdd = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlAddInstitutionNote = """insert into institution_notes (staff_id,institution_id, note) values (%s,%s,%s)"""
            value = (staffId, institutionId, note,)
            cursor.execute(sqlAddInstitutionNote, value)
            noteAdd.append('Institution note Added')
        except mysql.Error as e:
            noteAdd.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return noteAdd


class getInstitutionNotes(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionId = data["institutionId"]
        institutionNotes = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetCommissionDetails = """select name, note, institution_name, institution_notes.created_date, institution_notes.note_id from institution_notes 
                                    left outer join users on users.user_id=institution_notes.staff_id 
                                    left outer join institution on institution.institution_id = institution_notes.institution_id 
                                    where institution_notes.institution_id=%s and status=0"""
            value = (institutionId,)
            cursor.execute(sqlGetCommissionDetails, value)
            institutionNote = cursor.fetchall()
            if institutionNote:
                institutionNotes = json.dumps(institutionNote, default=str)
            else:
                institutionNotes.append('No data found')
        except mysql.Error as e:
            institutionNotes.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institutionNotes


class deleteInstitutionNote(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionNoteId = data["institutionNoteId"]
        institutionNotes = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetCommissionDetails = """update institution_notes set status=1 where note_id=%s"""
            value = (institutionNoteId,)
            cursor.execute(sqlGetCommissionDetails, value)
            institutionNotes.append('Note delete')
        except mysql.Error as e:
            institutionNotes.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institutionNotes


class getApplicationInvoiceDetails(Resource):
    def post(self):
        data = request.get_json(force=True)
        applicationId = data["applicationId"]
        invoiceDetails = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetInvoiceDetails = """select invoiceNo, invoiceSent, paidToUs from application where application_id=%s"""
            value = (applicationId,)
            cursor.execute(sqlGetInvoiceDetails, value)
            invoiceDetail = cursor.fetchall()
            if invoiceDetail:
                invoiceDetails = json.dumps(invoiceDetail, default=str)
            else:
                invoiceDetails.append('No data found')
        except mysql.Error as e:
            invoiceDetails.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return invoiceDetails


class updateApplicationInvoiceDetails(Resource):
    def post(self):
        data = request.get_json(force=True)
        applicationId = data["applicationId"]
        invoiceNumber = data["invoiceNumber"]
        invoiceSent = data["invoiceSent"]
        paidToUs = data["paidToUs"]
        institutionNotes = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetCommissionDetails = """update application set invoiceNo=%s, invoiceSent=%s, paidToUs=%s where application_id=%s"""
            value = (invoiceNumber, invoiceSent, paidToUs, applicationId,)
            cursor.execute(sqlGetCommissionDetails, value)
            institutionNotes.append('Invoice Updated')
        except mysql.Error as e:
            institutionNotes.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institutionNotes


class submitCommission(Resource):
    def post(self):
        data = request.get_json(force=True)
        institutionId = data["institutionId"]
        commissionCourseType = data["commissionCourseType"]
        commissionCommissionable = data["commissionCommissionable"]
        commissionValidFrom = data["commissionValidFrom"]
        commissionValidUntil = data["commissionValidUntil"]
        commissionMinNumber = data["commissionMinNumber"]
        commissionMaxNumber = data["commissionMaxNumber"]
        commissionPercent = data["commissionPercent"]
        commissionTerritory = data["commissionTerritory"]
        commissionAdd = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlAddCommission = """insert into commission_rate (course_type, course_name, valid_from, valid_until, min_num, 
                                    max_num, commission, territory, institution_id) 
                                    values (%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
            value = (commissionCourseType, commissionCommissionable, commissionValidFrom, commissionValidUntil,
                     commissionMinNumber, commissionMaxNumber, commissionPercent, commissionTerritory,
                     institutionId,)
            cursor.execute(sqlAddCommission, value)
            commissionAdd.append('commission Added')
        except mysql.Error as e:
            commissionAdd.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return commissionAdd


class deleteCommissionRate(Resource):
    def post(self):
        data = request.get_json(force=True)
        commissionId = data["commissionId"]
        commissionRate = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetCommissionDetails = """update commission_rate set status=1 where commission_rate_id=%s"""
            value = (commissionId,)
            cursor.execute(sqlGetCommissionDetails, value)
            commissionRate.append('Commission rate deleted')
        except mysql.Error as e:
            commissionRate.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return commissionRate


class addPartner(Resource):
    def post(self):
        data = request.get_json(force=True)
        companyName = data["companyName"]
        companyWebsite = data["companyWebsite"]
        directorFirstName = data["directorFirstName"]
        directorLastName = data["directorLastName"]
        directorEmail = data["directorEmail"]
        countryCode = data["countryCode"]
        directorContactNumber = data["directorContactNumber"]
        postalAddress = data["postalAddress"]
        city = data["city"]
        country = data["country"]
        bdm = data["bdm"]
        consultantAssigned = data["consultantAssigned"]
        contractDone = data["contractDone"]
        processingOffice = data["processingOffice"]

        addPartnerMsg = []

        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlPartnerAdd = """insert into partners(company_name, company_website, director_first_name, director_last_name, 
                            director_email, country_code, director_contact_number, postal_address, city, country, bdm, consultant_assigned, 
                            contract_done, processing_office)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            valPartnerAdd = (
            companyName, companyWebsite, directorFirstName, directorLastName, directorEmail, countryCode,
            directorContactNumber,
            postalAddress, city, country, bdm, consultantAssigned, contractDone, processingOffice,)
            cursor.execute(sqlPartnerAdd, valPartnerAdd)
            addPartnerMsg.append("Sucessfully Added the Partner")

        except mysql.Error as e:
            addPartnerMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return addPartnerMsg


class getPartners(Resource):
    def get(self):
        partnerDetails = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetPartnerDetails = """select partner_id, company_name from partners order by partner_id asc"""
            cursor.execute(sqlGetPartnerDetails)
            partnerDetail = cursor.fetchall()
            if partnerDetail:
                partnerDetails = json.dumps(partnerDetail, default=str)
            else:
                partnerDetails.append('No data found')

        except mysql.Error as e:
            partnerDetails.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerDetails


class getPartnersDetails(Resource):
    def get(self):
        partnerDetails = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetPartnerDetails = """select partner_id, company_name, company_website, director_first_name, director_last_name, 
                                    director_email, country, offices.office_name, consultant_assigned_user.name AS 
                                    consultant_assigned_username, bdm_user.name AS bdm_username, contract_done_user.name AS 
                                    contract_done_username from partners 
                                    left outer join offices on offices.office_id = partners.processing_office 
                                    left outer join users as bdm_user on bdm_user.user_id = partners.bdm 
                                    left outer join users as contract_done_user on contract_done_user.user_id = partners.contract_done 
                                    left outer join users as consultant_assigned_user on consultant_assigned_user.user_id = partners.consultant_assigned 
                                    order by partner_id desc"""
            cursor.execute(sqlGetPartnerDetails)
            partnerDetail = cursor.fetchall()
            if partnerDetail:
                partnerDetails = json.dumps(partnerDetail, default=str)
            else:
                partnerDetails.append('No data found')

        except mysql.Error as e:
            partnerDetails.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerDetails


class getPartnerWithId(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        partnerDetails = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetPartnerDetails = """select partner_id, company_name, company_website, director_first_name, director_last_name, 
                                    director_email, country_code, director_contact_number, postal_address, city, country, bdm, consultant_assigned, 
                                    contract_done, processing_office, commission_rate from partners where partner_id=%s"""
            value = (partnerId,)
            cursor.execute(sqlGetPartnerDetails, value)
            partnerDetail = cursor.fetchall()
            if partnerDetail:
                partnerDetails = json.dumps(partnerDetail, default=str)
            else:
                partnerDetails.append('No data found')
        except mysql.Error as e:
            partnerDetails.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerDetails


class updatePartner(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        companyName = data["companyName"]
        companyWebsite = data["companyWebsite"]
        directorFirstName = data["directorFirstName"]
        directorLastName = data["directorLastName"]
        directorEmail = data["directorEmail"]
        countryCode = data["countryCode"]
        directorContactNumber = data["directorContactNumber"]
        postalAddress = data["postalAddress"]
        city = data["city"]
        country = data["country"]
        bdm = data["bdm"]
        consultantAssigned = data["consultantAssigned"]
        contractDone = data["contractDone"]
        processingOffice = data["processingOffice"]
        commissionRate = data["commissionRate"]

        updatePartnerMsg = []

        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlPartnerUpdate = """update partners set company_name=%s, company_website=%s, director_first_name=%s, director_last_name=%s, 
                            director_email=%s, country_code=%s, director_contact_number=%s, postal_address=%s, city=%s, country=%s, 
                            bdm=%s, consultant_assigned=%s, contract_done=%s, processing_office=%s, commission_rate=%s where partner_id=%s"""
            valPartnerUpdate = (
            companyName, companyWebsite, directorFirstName, directorLastName, directorEmail, countryCode,
            directorContactNumber,
            postalAddress, city, country, bdm, consultantAssigned, contractDone, processingOffice, commissionRate,
            partnerId,)
            cursor.execute(sqlPartnerUpdate, valPartnerUpdate)

            sqlUpdateCredential = """update users set username=%s where partners_id=%s"""
            value = (directorEmail, partnerId)
            cursor.execute(sqlUpdateCredential, value)

            updatePartnerMsg.append("Sucessfully Updated the Partner")

        except mysql.Error as e:
            updatePartnerMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return updatePartnerMsg


class getApplicationsPartnerASDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        partnerReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, course_name, first_name, last_name, office_name, 
                                    name, date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                    students.email, lead_source, utm_source FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON offices.office_id = students.office_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND partner_id=%s"""
                query_params = [fromDate, toDate, partnerId, ]
            else:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, course_name, first_name, last_name, office_name, 
                                    name, date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                    students.email, lead_source, utm_source FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON offices.office_id = students.office_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND partner_id=%s
                                    AND students.office_id IN ({})"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, partnerId] + officeIds
            cursor.execute(sqlSelectASDReport, query_params)
            partnerReport_data = cursor.fetchall()
            if partnerReport_data:
                partnerReport = json.dumps(partnerReport_data, default=str)
            else:
                partnerReport.append('No data found')
        except mysql.Error as e:
            partnerReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerReport


class getApplicationsPartnerCSDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        partnerReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, course_name, first_name, last_name, office_name, 
                                    name, date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                    students.email, lead_source, utm_source FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON offices.office_id = students.office_id
                                    WHERE course_start_date BETWEEN %s AND %s AND partner_id=%s"""
                query_params = [fromDate, toDate, partnerId, ]
            else:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, course_name, first_name, last_name, office_name, 
                                    name, date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                    students.email, lead_source, utm_source FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON offices.office_id = students.office_id
                                    WHERE course_start_date BETWEEN %s AND %s AND partner_id=%s
                                    AND students.office_id IN ({})"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, partnerId] + officeIds
            cursor.execute(sqlSelectCSDReport, query_params)
            partnerReport_data = cursor.fetchall()
            if partnerReport_data:
                partnerReport = json.dumps(partnerReport_data, default=str)
            else:
                partnerReport.append('No data found')
        except mysql.Error as e:
            partnerReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerReport


class getApplicationsPartnerYearCountCSDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        partnerReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectCSDReport = """
                                    SELECT year(course_start_date) as year, COUNT(application_id) AS application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                    SUM(CASE WHEN offer_decision_type Is Null THEN 1 ELSE 0 END) AS pending_application_count FROM application 
					                left outer join students on students.student_id=application.student_id
                                    where application.course_start_date BETWEEN %s AND %s AND students.partner_id=%s
                                    group by year(course_start_date) order by year(course_start_date) desc"""
                query_params = [fromDate, toDate, partnerId, ]
            else:
                sqlSelectCSDReport = """
                                    SELECT year(course_start_date) as year, COUNT(application_id) AS application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                    SUM(CASE WHEN offer_decision_type Is Null THEN 1 ELSE 0 END) AS pending_application_count FROM application  
                                    left outer join students on application.student_id=students.student_id 
                                    where application.course_start_date BETWEEN %s AND %s AND students.office_id IN ({}) AND students.partner_id=%s
                                    group by year(course_start_date) order by year(course_start_date) desc"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, partnerId] + officeIds
            cursor.execute(sqlSelectCSDReport, query_params)
            partnerReport_data = cursor.fetchall()
            if partnerReport_data:
                partnerReport = json.dumps(partnerReport_data, default=str)
            else:
                partnerReport.append('No data found')
        except mysql.Error as e:
            partnerReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerReport


class getApplicationsPartnerYearCountASDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        partnerReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectASDReport = """
                                    SELECT year(course_start_date) as year, COUNT(application_id) AS application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                    SUM(CASE WHEN offer_decision_type Is Null THEN 1 ELSE 0 END) AS pending_application_count FROM application 
                                    left outer join students on application.student_id=students.student_id 
                                    where application.date_of_application_sent BETWEEN %s AND %s AND students.partner_id=%s
                                    group by year(course_start_date) order by year(course_start_date) desc"""
                query_params = [fromDate, toDate, partnerId, ]
            else:
                sqlSelectASDReport = """
                                    SELECT year(course_start_date) as year, COUNT(application_id) AS application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                    SUM(CASE WHEN offer_decision_type Is Null THEN 1 ELSE 0 END) AS pending_application_count FROM application  
                                    left outer join students on application.student_id=students.student_id 
                                    where application.date_of_application_sent BETWEEN %s AND %s AND students.office_id IN ({}) AND students.partner_id=%s
                                    group by year(course_start_date) order by year(course_start_date) desc"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, partnerId] + officeIds
            cursor.execute(sqlSelectASDReport, query_params)
            partnerReport_data = cursor.fetchall()
            if partnerReport_data:
                partnerReport = json.dumps(partnerReport_data, default=str)
            else:
                partnerReport.append('No data found')
        except mysql.Error as e:
            partnerReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerReport


class getFinalChoicesPartnerASDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        partnerReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectASDReport = """SELECT students.student_id AS student_id, first_name, last_name, students.email, 
                                    nationality, office_name, application.course_type, course_name, name, course_start_date, 
                                    tution_fee, partners.commission_rate, utm_source, utm_medium, utm_campaign, lead_source,
                                    invoiceNo, invoiceSent, paidToUs, application_id FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON students.office_id = offices.office_id
                                    LEFT OUTER JOIN partners ON students.partner_id = partners.partner_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND students.partner_id=%s AND final_choiced=1"""
                query_params = [fromDate, toDate, partnerId, ]
            else:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, students.email, 
                                    nationality, office_name, application.course_type, course_name, name, course_start_date, 
                                    tution_fee, commission_rate, utm_source, utm_medium, utm_campaign, lead_source,
                                    invoiceNo, invoiceSent, paidToUs, application_id FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON students.office_id = offices.office_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND partner_id=%s
                                    AND students.office_id IN ({}) AND final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, partnerId] + officeIds
            cursor.execute(sqlSelectASDReport, query_params)
            partnerReport_data = cursor.fetchall()
            if partnerReport_data:
                partnerReport = json.dumps(partnerReport_data, default=str)
            else:
                partnerReport.append('No data found')
        except mysql.Error as e:
            partnerReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerReport


class getFinalChoicessPartnerCSDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        partnerReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectCSDReport = """SELECT students.student_id AS student_id, first_name, last_name, students.email, 
                                    nationality, office_name, application.course_type, course_name, name, course_start_date, 
                                    tution_fee, partners.commission_rate, utm_source, utm_medium, utm_campaign, lead_source,
                                    invoiceNo, invoiceSent, paidToUs, application_id FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON students.office_id = offices.office_id
                                    LEFT OUTER JOIN partners ON students.partner_id = partners.partner_id
                                    WHERE course_start_date BETWEEN %s AND %s AND students.partner_id=%s AND final_choiced=1"""
                query_params = [fromDate, toDate, partnerId, ]
            else:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, students.email, 
                                    nationality, office_name, application.course_type, course_name, name, course_start_date, 
                                    tution_fee, commission_rate, utm_source, utm_medium, utm_campaign, lead_source,
                                    invoiceNo, invoiceSent, paidToUs, application_id FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON students.office_id = offices.office_id
                                    WHERE course_start_date BETWEEN %s AND %s AND partner_id=%s
                                    AND students.office_id IN ({}) AND final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, partnerId] + officeIds
            cursor.execute(sqlSelectCSDReport, query_params)
            partnerReport_data = cursor.fetchall()
            if partnerReport_data:
                partnerReport = json.dumps(partnerReport_data, default=str)
            else:
                partnerReport.append('No data found')
        except mysql.Error as e:
            partnerReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerReport


class getFinalChoicesPartnerCourseTypeASDCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        partnerReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectASDReport = """SELECT COUNT(*) AS total_count, COUNT(CASE WHEN course_type = 'Postgraduate' THEN 1 END) AS pg_count, 
                                    COUNT(CASE WHEN course_type = 'Undergraduate' THEN 1 END) AS ug_count, 
                                    COUNT(CASE WHEN course_type = 'Pathways Follow on' THEN 1 END) AS pathways_follow_count, 
                                    COUNT(CASE WHEN course_type = 'Year 2 Follow on' THEN 1 END) AS Y2_count, 
                                    COUNT(CASE WHEN course_type = 'Year 3 Follow on' THEN 1 END) AS Y3_count, 
                                    COUNT(CASE WHEN course_type = 'Pre-Sessional' THEN 1 END) AS preSess_count, 
                                    SUM(CASE WHEN course_type IN ('Pre-Masters', 'Foundation', 'Phd', 'Summer School') THEN 1 ELSE 0 END) AS other_count 
                                    FROM application 
                                    left outer join students on application.student_id=students.student_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND students.partner_id=%s AND final_choiced=1"""
                query_params = [fromDate, toDate, partnerId, ]
            else:
                sqlSelectASDReport = """
                                    SELECT COUNT(*) AS total_count, COUNT(CASE WHEN course_type = 'Postgraduate' THEN 1 END) AS pg_count, 
                                    COUNT(CASE WHEN course_type = 'Undergraduate' THEN 1 END) AS ug_count, 
                                    COUNT(CASE WHEN course_type = 'Pathways Follow on' THEN 1 END) AS pathways_follow_count, 
                                    COUNT(CASE WHEN course_type = 'Year 2 Follow on' THEN 1 END) AS Y2_count, 
                                    COUNT(CASE WHEN course_type = 'Year 3 Follow on' THEN 1 END) AS Y3_count, 
                                    COUNT(CASE WHEN course_type = 'Pre-Sessional' THEN 1 END) AS preSess_count, 
                                    SUM(CASE WHEN course_type IN ('Pre-Masters', 'Foundation', 'Phd', 'Summer School') THEN 1 ELSE 0 END) AS other_count 
                                    FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND students.partner_id=%s
                                    AND students.office_id IN ({}) AND final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, partnerId] + officeIds
            cursor.execute(sqlSelectASDReport, query_params)
            partnerReport_data = cursor.fetchall()
            if partnerReport_data:
                partnerReport = json.dumps(partnerReport_data, default=str)
            else:
                partnerReport.append('No data found')
        except mysql.Error as e:
            partnerReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerReport


class getFinalChoicesPartnerCourseTypeCSDCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        partnerReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectCSDReport = """SELECT COUNT(*) AS total_count, COUNT(CASE WHEN course_type = 'Postgraduate' THEN 1 END) AS pg_count, 
                                    COUNT(CASE WHEN course_type = 'Undergraduate' THEN 1 END) AS ug_count, 
                                    COUNT(CASE WHEN course_type = 'Pathways Follow on' THEN 1 END) AS pathways_follow_count, 
                                    COUNT(CASE WHEN course_type = 'Year 2 Follow on' THEN 1 END) AS Y2_count, 
                                    COUNT(CASE WHEN course_type = 'Year 3 Follow on' THEN 1 END) AS Y3_count, 
                                    COUNT(CASE WHEN course_type = 'Pre-Sessional' THEN 1 END) AS preSess_count, 
                                    SUM(CASE WHEN course_type IN ('Pre-Masters', 'Foundation', 'Phd', 'Summer School') THEN 1 ELSE 0 END) AS other_count 
                                    FROM application 
                                    left outer join students on application.student_id=students.student_id
                                    WHERE course_start_date BETWEEN %s AND %s AND students.partner_id=%s AND final_choiced=1"""
                query_params = [fromDate, toDate, partnerId, ]
            else:
                sqlSelectCSDReport = """
                                    SELECT COUNT(*) AS total_count, COUNT(CASE WHEN course_type = 'Postgraduate' THEN 1 END) AS pg_count, 
                                    COUNT(CASE WHEN course_type = 'Undergraduate' THEN 1 END) AS ug_count, 
                                    COUNT(CASE WHEN course_type = 'Pathways Follow on' THEN 1 END) AS pathways_follow_count, 
                                    COUNT(CASE WHEN course_type = 'Year 2 Follow on' THEN 1 END) AS Y2_count, 
                                    COUNT(CASE WHEN course_type = 'Year 3 Follow on' THEN 1 END) AS Y3_count, 
                                    COUNT(CASE WHEN course_type = 'Pre-Sessional' THEN 1 END) AS preSess_count, 
                                    SUM(CASE WHEN course_type IN ('Pre-Masters', 'Foundation', 'Phd', 'Summer School') THEN 1 ELSE 0 END) AS other_count 
                                    FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    WHERE course_start_date BETWEEN %s AND %s AND partner_id=%s
                                    AND students.office_id IN ({}) AND final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, partnerId] + officeIds
            cursor.execute(sqlSelectCSDReport, query_params)
            partnerReport_data = cursor.fetchall()
            if partnerReport_data:
                partnerReport = json.dumps(partnerReport_data, default=str)
            else:
                partnerReport.append('No data found')
        except mysql.Error as e:
            partnerReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerReport


class getPartnerWithOfficeId(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        partnerDetails = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetPartnerDetails = """select partner_id, company_name, company_website, director_first_name, director_last_name, 
                                    director_email, country_code, director_contact_number, postal_address, city, country, bdm, consultant_assigned, 
                                    contract_done, processing_office from partners where processing_office=%s order by partner_id asc"""
            value = (officeId,)
            cursor.execute(sqlGetPartnerDetails, value)
            partnerDetail = cursor.fetchall()
            if partnerDetail:
                partnerDetails = json.dumps(partnerDetail, default=str)
            else:
                partnerDetails.append('No data found')
        except mysql.Error as e:
            partnerDetails.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerDetails


class partnerContractFileUpload(Resource):
    def post(self):
        file = request.files["file"]
        partnerId = request.form["partnerId"]
        filename = secure_filename(file.filename)
        uploadFile = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            file.save(os.path.join(CONTRACT_FOLDER, filename))
            uploadFile.append('File uploaded Successfully\n')
            try:
                sqlAddContractFile = """insert into partner_contract (partner_contract_file, partner_id) values (%s, %s)"""
                value = (filename, partnerId,)
                cursor.execute(sqlAddContractFile, value)
                last_insert_id = cursor.lastrowid
                uploadFile.append('File Added')
                uploadFile.append(last_insert_id)
            except mysql.Error as e:
                uploadFile.append(str(e))
            finally:
                cnx.commit()
                cursor.close()
        except OSError as e:
            uploadFile.append(str(e))

        return uploadFile


class getPartnerContractFile(Resource):
    def post(self):
        data = request.get_json(force=True)
        fileName = data["fileName"]
        fileType = ""
        try:
            base64_files = []  # Initialize a list to store the Base64-encoded images
            file_path = os.path.join(CONTRACT_FOLDER, fileName)

            # Check if the file exists
            image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tif', '.tiff'}
            if os.path.exists(file_path) and os.path.splitext(file_path)[1].lower() in image_extensions:
                with open(file_path, 'rb') as image_file:
                    image_contents = image_file.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_image = base64.b64encode(image_contents).decode('utf-8')
                    base64_files.append(base64_image)
                fileType = "image"
            elif os.path.exists(file_path) and os.path.splitext(file_path)[1].lower() == '.pdf':
                # Open and read the file
                with open(file_path, 'rb') as file_to_read:
                    file_contents = file_to_read.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_pdf = base64.b64encode(file_contents).decode('utf-8')
                    base64_files.append(base64_pdf)
                fileType = "pdf"
            elif os.path.exists(file_path) and (os.path.splitext(file_path)[1].lower() == '.xlsx'
                                                or os.path.splitext(file_path)[1].lower() == '.xls'):
                # Open and read the Excel file
                with open(file_path, 'rb') as excel_file:
                    excel_contents = excel_file.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_excel = base64.b64encode(excel_contents).decode('utf-8')
                    base64_files.append(base64_excel)
                fileType = "xl"
            elif os.path.exists(file_path) and os.path.splitext(file_path)[1].lower() == '.csv':
                # Open and read the CSV file
                with open(file_path, 'rb') as csv_file:
                    csv_contents = csv_file.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_csv = base64.b64encode(csv_contents).decode('utf-8')
                    base64_files.append(base64_csv)
                fileType = "csv"
            else:
                base64_files.append('')
                fileType = ""
        except mysql.Error as e:
            staffDet.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return [base64_files, fileType]


class updatePartnerContractFiles(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        contractFiles = data["contractFiles"]

        institution = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlUpdateInstitution = """update partners set partner_contract_files=%s where partner_id=%s"""
            value = (contractFiles, partnerId,)
            cursor.execute(sqlUpdateInstitution, value)
            institution.append('Contract Files Updated')
        except mysql.Error as e:
            institution.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institution


class getPartnerContractFileList(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        partnerContract = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetPartnerContractFile = """select partner_id, partner_contract_files from partners where partner_id= %s order by partner_id asc"""
            value = (partnerId,)
            cursor.execute(sqlGetPartnerContractFile, value)
            partnerContract = cursor.fetchall()
            if partnerContract:
                partnerContract = json.dumps(partnerContract, default=str)
            else:
                partnerContract.append('No data found')
        except mysql.Error as e:
            partnerContract.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerContract


class addPartnerNotes(Resource):
    def post(self):
        data = request.get_json(force=True)
        staffId = data["staffId"]
        partnerId = data["partnerId"]
        note = data["note"]
        noteAdd = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlAddPartnerNote = """insert into partner_note (staff_id,partner_id, partner_note) values (%s,%s,%s)"""
            value = (staffId, partnerId, note,)
            cursor.execute(sqlAddPartnerNote, value)
            noteAdd.append('Partner note Added')
        except mysql.Error as e:
            noteAdd.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return noteAdd


class getPartnerNotes(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        partnerNotes = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetPartnerNotes = """select name, partner_note, partner_note.created_date, partner_note.partner_note_id from partner_note 
                                    left outer join users on users.user_id=partner_note.staff_id 
                                    where partner_note.partner_id=%s and status=0 order by partner_note_id desc"""
            value = (partnerId,)
            cursor.execute(sqlGetPartnerNotes, value)
            partnerNotes = cursor.fetchall()
            if partnerNotes:
                partnerNotes = json.dumps(partnerNotes, default=str)
            else:
                partnerNotes.append('No data found')
        except mysql.Error as e:
            partnerNotes.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerNotes


class deletePartnerNote(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerNoteId = data["partnerNoteId"]
        partnerNotes = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetPartnerNote = """update partner_note set status=1 where partner_note_id=%s"""
            value = (partnerNoteId,)
            cursor.execute(sqlGetPartnerNote, value)
            partnerNotes.append('Note delete')
        except mysql.Error as e:
            partnerNotes.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerNotes


class updatePartnerCredential(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        passwordStr = data["password"]
        partnerCredential = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            password_key = Fernet.generate_key()
            fernet = Fernet(password_key)
            password = fernet.encrypt(passwordStr.encode())

            sqlUpdateCredential = """update users set password=%s, 
                                                password_str=%s, password_key=%s where partners_id=%s"""
            value = (password, passwordStr, password_key, partnerId,)
            cursor.execute(sqlUpdateCredential, value)
            partnerCredential.append('Partner credential updated')
        except mysql.Error as e:
            partnerCredential.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerCredential


class sendPartnerCredential(Resource):
    def post(self):
        data = request.get_json(force=True)
        name = data["name"]
        email = data["email"]
        password = data["password"]
        partnerCredential = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            htmlContent = f"<p>Hi {name},</p><p>Your account credentials are as follows</p><p>Username :- {email} <br>Password:- {password}" \
                          f"</p>" \
                          f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
            sendMail('Account Credentials', htmlContent, email)
            partnerCredential.append('Partner credential sent')
        except mysql.Error as e:
            partnerCredential.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerCredential


class getPartnerPassword(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        partnerPassword = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetpartnerPassword = """select password_str FROM users WHERE partners_id = %s"""
            value = (partnerId,)
            cursor.execute(sqlGetpartnerPassword, value)
            partnerPassword = cursor.fetchall()
            if partnerPassword:
                partnerPassword = json.dumps(partnerPassword, default=str)
            else:
                partnerPassword.append('No data found')
        except mysql.Error as e:
            partnerPassword.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerPassword


class addPartnerStudent(Resource):
    def post(self):
        data = request.get_json(force=True)
        firstName = data['firstName']
        lastName = data['lastName']
        countryCode = data["countryCode"]
        phone = data['phone']
        email = data['email']
        office = data['office']
        partner = data['partner']
        nationality = data['nationality']
        dob = data['dob']
        leadSource = data['leadSource']
        studyAbroadDestination = data["studyAbroadDestination"]
        addStudMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectPartner = """select consultant_assigned from partners where partners.partner_id=%s"""
            value = (partner,)
            cursor.execute(sqlSelectPartner, value)
            partner_data = cursor.fetchone()
            if partner_data:
                counsilor_id = partner_data[0]
            else:
                counsilor_id = 'NULL'
            sqlStudentAdd = """insert into students(office_id, partner_id, first_name, last_name, country_code, mobile_no, email, lead_source, 
                            nationality, dob, status, study_abroad_destination,counsilor_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            valStudAdd = (office, partner, firstName, lastName, countryCode, phone, email, leadSource, nationality,
                          dob, "Lead", studyAbroadDestination, counsilor_id)
            cursor.execute(sqlStudentAdd, valStudAdd)
            last_insert_id = cursor.lastrowid

            sqlAddNote = """insert into notes(student_id, partner_ids, note, contact_type, lead_source)
                                                    values (%s, %s, %s, %s, %s)"""
            value = (last_insert_id, partner, "Lead added via Add student", leadSource, "")
            cursor.execute(sqlAddNote, value)

            sqlGetManager = """select name, username from users where office_id=%s and role=%s and partners_id = %s AND username != 'rajindersingh@uan-networks.com'"""
            value = (office, "partner", partner)
            cursor.execute(sqlGetManager, value)
            managerDetails = cursor.fetchall()
            if (managerDetails):
                for managerDetail in managerDetails:
                    managerName = managerDetail[0]
                    managerMail = managerDetail[1]
                    htmlContent = f"<p>Hi {managerName},</p><p>You have added a new student in UAN CRM.</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {last_insert_id}" \
                                  f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                                  f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
                    sendMail('Registration form Student Added', htmlContent, managerMail)

            '''Mail send to student'''
            htmlContent = f"<p>Hi {firstName} {lastName},</p><p>Thank you for registering with us. Our team will get in touch with you soon.</p>" \
                          f"<p>Thanks<br>UAN Team</p>"
            sendMail('UAN Registration Successes', htmlContent, email)

            htmlContent = f"<p>Hi Admin,</p><p>You have a new student registration</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {last_insert_id}" \
                          f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                          f"<p>Thanks<br>UAN Team</p>"
            sendMail('Registration form Student Added', htmlContent, adminMail)

            addStudMsg.append('Sucessfully added partner student')
        except mysql.Error as e:
            addStudMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return addStudMsg


class getPartnerStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        partnerId = data["partnerId"]
        studentDetails = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectStud = """select student_id, first_name, last_name, students.email, mobile_no, dob, name from students 
                        left outer join users on students.partner_id=users.partners_id where students.partner_id=%s"""
            value = (partnerId,)
            cursor.execute(sqlSelectStud, value)
            students_data = cursor.fetchall()
            if students_data:
                studentDetails = json.dumps(students_data, default=str)
            else:
                studentDetails.append('No data found')
        except mysql.Error as e:
            studentDetails.append(str(e))
        finally:
            cursor.close()

        return studentDetails


class getPartnerStudentManagerEDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        toDate = datetime.strptime(toDate, '%Y-%m-%d')
        toDate = toDate + timedelta(days=1)
        toDate = toDate.strftime('%Y-%m-%d')
        partnerId = data["partnerId"]
        status = data["status"]
        status = status.split(",")
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        studentManagerEDReport = []
        cursor = cnx.cursor()
        try:
            if "All" in status:
                sqlSelectEDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, students.email, mobile_no, 
                                    students.created_date, students.status, students.lead_source, note, utm_source,
                                    utm_medium, utm_campaign FROM students 
                                    LEFT OUTER JOIN notes ON students.student_id = notes.student_id 
                                    LEFT OUTER JOIN partners ON students.partner_id = partners.partner_id 
                                    WHERE (notes.student_id, notes.created_date) IN (SELECT student_id, MAX(notes.created_date) 
                                    FROM notes GROUP BY student_id) and students.created_date BETWEEN %s AND %s AND students.partner_id = %s
                                    """

                query_params = [fromDate, toDate, partnerId]

            elif "All" not in status:
                sqlSelectEDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, students.email, mobile_no, 
                                    students.created_date, students.status, students.lead_source, note FROM students 
                                    LEFT OUTER JOIN notes ON students.student_id = notes.student_id 
                                    LEFT OUTER JOIN partners ON students.partner_id = partners.partner_id 
                                    WHERE (notes.student_id, notes.created_date) IN (SELECT student_id, MAX(notes.created_date) 
                                    FROM notes GROUP BY student_id) and students.created_date BETWEEN %s AND %s
                                    AND students.status IN ({}) AND students.partner_id = %s 
                                    """
                statusJoinData = ', '.join(['%s'] * len(status))

                sqlSelectEDReport = sqlSelectEDReport.format(statusJoinData)

                query_params = [fromDate, toDate] + status + [partnerId]
            cursor.execute(sqlSelectEDReport, query_params)
            edReport = cursor.fetchall()

            if edReport:
                studentManagerEDReport = json.dumps(edReport, default=str)
            else:
                studentManagerEDReport.append('No data found')

        except mysql.Error as e:
            studentManagerEDReport.append(str(e))
        finally:
            cursor.close()
        return studentManagerEDReport


class getPartnerStaticCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        toDate = datetime.strptime(toDate, '%Y-%m-%d')
        toDate = toDate + timedelta(days=1)
        toDate = toDate.strftime('%Y-%m-%d')
        partnerId = data["partnerId"]
        status = data["status"]
        statusIds = status.split(",")
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        staticCountReport = []
        cursor = cnx.cursor()
        try:
            if "All" in statusIds:
                sqlSelectCountReport = """
                                select 
                                count(DISTINCT IF(students.lead_source="Web",students.student_id,NULL)) as enquiry_count,
                                count(DISTINCT IF(students.status="Active",students.student_id,NULL)) as active_count, 
                                count(DISTINCT IF(students.status="Inactive",students.student_id,NULL)) as inactive_count, 
                                count(DISTINCT IF(students.status="Closed",students.student_id,NULL)) as closed_count,
                                count(IF(cas_issued="casIssued",1,NULL)) as cas_count from students
                                left outer join application on students.student_id=application.student_id 
                                where students.created_date BETWEEN %s AND %s
                                AND students.partner_id = %s
                                """
                query_params = [fromDate, toDate, partnerId]
            else:
                sqlSelectCountReport = """
                                    select 
                                    count(DISTINCT IF(students.lead_source="Web",students.student_id,NULL)) as enquiry_count,
                                    count(DISTINCT IF(students.status="Active",students.student_id,NULL)) as active_count, 
                                    count(DISTINCT IF(students.status="Inactive",students.student_id,NULL)) as inactive_count, 
                                    count(DISTINCT IF(students.status="Closed",students.student_id,NULL)) as closed_count,
                                    count(IF(cas_issued="casIssued",1,NULL)) as cas_count from students
                                    left outer join application on students.student_id=application.student_id 
                                    where students.created_date BETWEEN %s AND %s
                                    AND students.partner_id = %s AND students.status IN ({})
                                    """
                statusIdJoinData = ', '.join(['%s'] * len(statusIds))

                sqlSelectCountReport = sqlSelectCountReport.format(statusIdJoinData)

                query_params = [fromDate, toDate, partnerId] + statusIds

            cursor.execute(sqlSelectCountReport, query_params)
            countReport = cursor.fetchall()

            if countReport:
                staticCountReport = json.dumps(countReport, default=str)
            else:
                staticCountReport.append('No data found')
        except mysql.Error as e:
            staticCountReport.append(str(e))
        finally:
            cursor.close()
        return staticCountReport


class getCountOfPartnerDashboard(Resource):
    def post(self):
        data = request.get_json(force=True)
        year = data["year"]
        partnerId = data["partnerId"]
        dashboardCount = [];
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetStudCount = """SELECT count(*) FROM students WHERE YEAR(created_date)=%s and partner_id=%s"""
            value = (year, partnerId,)
            cursor.execute(sqlGetStudCount, value)
            studentCount = cursor.fetchall()
            if studentCount:
                dashboardCount.append(studentCount)
            else:
                dashboardCount.append('No data found')

            sqlGetApplicationCount = """select count(*) from application inner join students on application.student_id=students.student_id 
            where YEAR(application.course_start_date)=%s and partner_id=%s"""
            value = (year, partnerId,)
            cursor.execute(sqlGetApplicationCount, value)
            applicationCount = cursor.fetchall()
            if applicationCount:
                dashboardCount.append(applicationCount)
            else:
                dashboardCount.append('No data found')

            sqlGetFinalChoiceCount = """select count(*) from application inner join students on application.student_id=students.student_id 
                            where final_choiced=1 and YEAR(application.course_start_date)=%s and partner_id=%s"""
            value = (year, partnerId,)
            cursor.execute(sqlGetFinalChoiceCount, value)
            finalChoiceCount = cursor.fetchall()
            if finalChoiceCount:
                dashboardCount.append(finalChoiceCount)
            else:
                dashboardCount.append('No data found')

            sqlGetUnAssignedLeadsCount = """select count(*) from students where counsilor_id is null and YEAR(created_date)=%s and partner_id=%s"""
            value = (year, partnerId,)
            cursor.execute(sqlGetUnAssignedLeadsCount, value)
            unAssignedLeadsCount = cursor.fetchall()
            if unAssignedLeadsCount:
                dashboardCount.append(unAssignedLeadsCount)
            else:
                dashboardCount.append('No data found')
        except mysql.Error as e:
            dashboardCount.append(str(e))
        finally:
            cursor.close()

        return dashboardCount


class getAllPartnerStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        status = data["status"]
        status = status.capitalize()
        students = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if (status == "Unassigned"):
                sqlGetStudents = """select student_id, partner_id, first_name, last_name, 
                                            students.created_date, students.status from students
                                            WHERE partner_id=%s AND s.counsilor_id is Null"""
                value = (partnerId, status)
            elif (status == "Assigned"):
                sqlGetStudents = """select student_id, partner_id, first_name, last_name, 
                                    students.created_date, students.status from students
                                    WHERE partner_id=%s and students.status=%s"""
                value = (partnerId, "Lead")
            elif (status == "All"):
                sqlGetStudents = """select student_id, partner_id, first_name, last_name, 
                                                   students.created_date, students.status from students
                                                   WHERE partner_id=%s"""
                value = (partnerId,)
            else:
                sqlGetStudents = """select student_id, partner_id, first_name, last_name, 
                                    students.created_date, students.status from students
                                    WHERE partner_id=%s and students.status=%s"""
                value = (partnerId, status)
            cursor.execute(sqlGetStudents, value)
            studentsList = cursor.fetchall()
            if studentsList:
                students = json.dumps(studentsList, default=str)
            else:
                students.append('No data found')
        except mysql.Error as e:
            students.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return students


class getPartnerStudentNotes(Resource):
    def post(self):
        data = request.get_json(force=True)
        student_id = data["studentId"]
        studentNotes = []

        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectStud = """SELECT name, note, contact_type, lead_source, notes.created_date, notes.status, reminder_date, note_id FROM notes 
                            left outer join users on users.partners_id=notes.partner_ids WHERE student_id=%s order by note_id desc"""
            value = (student_id,)
            cursor.execute(sqlSelectStud, value)
            students_data = cursor.fetchall()
            if students_data:
                studentNotes = json.dumps(students_data, default=str)
            else:
                studentNotes.append('No data found')
        except mysql.Error as e:
            studentNotes.append(str(e))
        finally:
            cursor.close()

        return studentNotes


class addPartnerStudentNotes(Resource):
    def post(self):
        data = request.get_json(force=True)
        studentId = data["studentId"]
        partnerId = data["partnerId"]
        note = data["note"]
        contactType = data["contactType"]
        reminderDate = data["reminderDate"]
        leadSource = data["leadSource"]
        if (reminderDate == ""):
            status = 0;
        else:
            status = 1
        addNoteMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlAddNote = """insert into notes(student_id, partner_ids, note, reminder_date, contact_type, lead_source, status)
                            values (%s, %s, %s, %s, %s, %s, %s)"""
            value = (studentId, partnerId, note, reminderDate, contactType, leadSource, status,)
            cursor.execute(sqlAddNote, value)
            addNoteMsg.append("Sucessfully Added the Notes")
        except mysql.Error as e:
            addNoteMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return addNoteMsg


class getPartnerYearStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        selectedYear = data["year"]
        partnerId = data["partnerId"]
        status = data["status"]
        status = status.capitalize()
        selectedData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if (status == "Unassigned"):
                sqlSelectStud = """SELECT s.student_id, s.first_name, s.last_name, s.email, s.mobile_no, s.dob, utm_source, sn.note AS last_note, sn.created_date AS last_note_date,s.status FROM students s 
                            LEFT OUTER JOIN (SELECT student_id, MAX(created_date) AS max_note_date FROM notes 
                            GROUP BY student_id) max_notes ON s.student_id = max_notes.student_id
                            LEFT OUTER JOIN notes sn ON s.student_id = sn.student_id AND max_notes.max_note_date = sn.created_date
                            where YEAR(s.created_date) = %s AND partner_id = %s AND s.counsilor_id is Null"""
                value = (selectedYear, partnerId)
            elif (status == "Assigned"):
                sqlSelectStud = """SELECT s.student_id, s.first_name, s.last_name, s.email, s.mobile_no, s.dob, utm_source, sn.note AS last_note, sn.created_date AS last_note_date,s.status FROM students s 
                                                LEFT OUTER JOIN (SELECT student_id, MAX(created_date) AS max_note_date FROM notes 
                                                GROUP BY student_id) max_notes ON s.student_id = max_notes.student_id
                                                LEFT OUTER JOIN notes sn ON s.student_id = sn.student_id AND max_notes.max_note_date = sn.created_date
                                                where YEAR(s.created_date) = %s AND partner_id = %s AND s.status = %s"""
                value = (selectedYear, partnerId, "Lead")
            elif (status == "All"):
                sqlSelectStud = """SELECT s.student_id, s.first_name, s.last_name, s.email, s.mobile_no, s.dob, utm_source, sn.note AS last_note, sn.created_date AS last_note_date,s.status FROM students s 
                                            LEFT OUTER JOIN (SELECT student_id, MAX(created_date) AS max_note_date FROM notes 
                                            GROUP BY student_id) max_notes ON s.student_id = max_notes.student_id
                                            LEFT OUTER JOIN notes sn ON s.student_id = sn.student_id AND max_notes.max_note_date = sn.created_date
                                            where YEAR(s.created_date) = %s AND partner_id = %s"""
                value = (selectedYear, partnerId)
            else:
                sqlSelectStud = """SELECT s.student_id, s.first_name, s.last_name, s.email, s.mobile_no, s.dob, utm_source, sn.note AS last_note, sn.created_date AS last_note_date,s.status FROM students s 
                                            LEFT OUTER JOIN (SELECT student_id, MAX(created_date) AS max_note_date FROM notes 
                                            GROUP BY student_id) max_notes ON s.student_id = max_notes.student_id
                                            LEFT OUTER JOIN notes sn ON s.student_id = sn.student_id AND max_notes.max_note_date = sn.created_date
                                            where YEAR(s.created_date) = %s AND partner_id = %s AND s.status = %s"""
                value = (selectedYear, partnerId, status)
            cursor.execute(sqlSelectStud, value)
            students_data = cursor.fetchall()
            if students_data:
                selectedData = json.dumps(students_data, default=str)
            else:
                selectedData.append('No data found')

        except mysql.Error as e:
            selectedData.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return selectedData


class getPartnerApplications(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data['partnerId']
        selectedYear = data['year']

        applicationData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectApp = """select application.student_id, application_id, institution_name, course_name, course_start_date,
                            first_name, last_name, date_of_application_sent from application left outer join students on 
                            students.student_id=application.student_id where YEAR(application.course_start_date)=%s AND partner_id = %s"""
            value = (selectedYear, partnerId)

            cursor.execute(sqlSelectApp, value)
            application_data = cursor.fetchall()
            if application_data:
                applicationData = json.dumps(application_data, default=str)
            else:
                applicationData.append('No data found')

        except mysql.Error as e:
            applicationData.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return applicationData


class getPartnerFinalChoicedApplication(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data['partnerId']
        selectedYear = data['year']

        finalChoiceApplicationData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectApp = """select application.student_id, application_id, institution_name, course_name, course_start_date,
                            first_name, last_name, date_of_application_sent from application left outer join students on 
                            students.student_id=application.student_id where YEAR(application.course_start_date)=%s AND partner_id = %s AND final_choiced=1"""
            value = (selectedYear, partnerId)

            cursor.execute(sqlSelectApp, value)
            finalchoiced_application_data = cursor.fetchall()
            if finalchoiced_application_data:
                finalChoiceApplicationData = json.dumps(finalchoiced_application_data, default=str)
            else:
                finalChoiceApplicationData.append('No data found')

        except mysql.Error as e:
            finalChoiceApplicationData.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return finalChoiceApplicationData


class getStaffCount(Resource):
    def get(self):
        staffCount = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            # Count active users
            cursor.execute("SELECT COUNT(*) FROM users WHERE deactivate = 0 and role!='partner'")
            active_count = cursor.fetchone()[0]

            # Count inactive users
            cursor.execute("SELECT COUNT(*) FROM users WHERE deactivate = 1 and role!='partner'")
            inactive_count = cursor.fetchone()[0]

            staffCount.append({'active_count': active_count, 'inactive_count': inactive_count})
        except mysql.Error as e:
            staffCount.append(str(e))
        finally:
            cursor.close()

        return staffCount


class partnerStatusUpdate(Resource):
    def post(self):
        data = request.get_json(force=True)
        studentId = data["studentId"]
        status = data["status"]
        # subStatus = data["subStatus"]
        office = data["office"]
        consultant = data["consultant"]
        marketingSource = data["marketingSource"]
        partner = data["partner"]
        firstName = data["firstName"]
        lastName = data["lastName"]
        phone = data["phone"]
        email = data["email"]
        nationality = data["nationality"]
        userId = data["userId"]
        updated_by = data["updated_by"]
        refferalId = data["refferalId"]

        addStudMsg = []
        statusUpdateMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            cursor.execute("SELECT partner_id FROM students WHERE student_id = %s", (studentId,))
            old_partner_id = cursor.fetchone()[0]

            cursor.execute("SELECT counsilor_id FROM students WHERE student_id = %s", (studentId,))
            old_counsellor_id = cursor.fetchone()[0]

            if old_counsellor_id is not None:
                sqlGetOldCounselorName = """select name, username from users where user_id=%s"""
                value = (old_counsellor_id,)
                cursor.execute(sqlGetOldCounselorName, value)
                counselorDetailOld = cursor.fetchone()
                counselorNameOld = counselorDetailOld[0]
                counselorMailOld = counselorDetailOld[1]

                sqlGetCounselorName = """select name, username from users where user_id=%s"""
                value = (consultant,)
                cursor.execute(sqlGetCounselorName, value)
                counselorDetail = cursor.fetchone()
                counselorName = counselorDetail[0]
                counselorMail = counselorDetail[1]
            else:
                counselorNameOld = None
                counselorMailOld = None

            sqlGetOldOffice = """SELECT S.office_id,O.office_name FROM students S INNER JOIN offices O ON S.office_id = O.office_id WHERE student_id = %s"""
            value = (studentId,)
            cursor.execute(sqlGetOldOffice, value)
            officeDetailOld = cursor.fetchone()
            old_office_id = officeDetailOld[0]
            old_office_name = officeDetailOld[1]

            cursor.execute(
                "SELECT office_name FROM offices WHERE office_id = %s",
                (office,))
            office_name = cursor.fetchone()[0]

            sqlUpdateStud = """update students set status=%s, office_id=%s, counsilor_id=%s, lead_source=%s, partner_id=%s, updated_by=%s,refferal_id=%s
                            where student_id=%s"""
            value = (status, office, consultant, marketingSource, partner, updated_by, refferalId, studentId,)
            cursor.execute(sqlUpdateStud, value)

            sqlUpdateApplication = """update application set partner=%s
                                        where student_id=%s"""
            valueApplication = (partner, studentId,)
            cursor.execute(sqlUpdateApplication, valueApplication)

            if old_counsellor_id != consultant:

                sqlAddNote = """insert into notes(student_id, counsilor_id, note, contact_type, lead_source)
                                                                        values (%s, %s, %s, %s, %s)"""
                noteAddValue = (studentId, userId,
                                f"Reassigned from {old_office_name}-{counselorNameOld} to {office_name}-{counselorName}",
                                "Profile Reassigning", "")
                cursor.execute(sqlAddNote, noteAddValue)

                htmlContent = f"<p>Hi {counselorName},</p><p>You have been assigned a new student</p><p>Student Name : {firstName} {lastName} </p> <p>Student ID : {studentId}</p>" \
                              f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
                sendMail('New Student Assigned', htmlContent, counselorMail)
                sqlGetManager = """select name, username, office_id from users where office_id=%s and role=%s AND username != 'rajindersingh@uan-networks.com'"""
                value = (office, "manager",)
                cursor.execute(sqlGetManager, value)
                managerDetails = cursor.fetchall()
                if (managerDetails):
                    for managerDetail in managerDetails:
                        managerName = managerDetail[0]
                        managerMail = managerDetail[1]
                        managerOfficeId = managerDetail[2]
                        if managerOfficeId != office:
                            htmlContent = f"<p>Hi {managerName},</p><p>Your office has been assigned a new student</p>" \
                                          f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
                            sendMail('New Student Assigned', htmlContent, managerMail)

            if old_partner_id != partner and partner:

                sqlGetPartner = """select director_first_name,director_last_name,director_email from partners where partner_id = %s"""
                value = (partner,)
                cursor.execute(sqlGetPartner, value)
                partnerDetails = cursor.fetchall()
                if (partnerDetails):
                    for partnerDetail in partnerDetails:
                        partnerName = partnerDetail[0] + " " + partnerDetail[1]
                        partnerMail = partnerDetail[2]
                        htmlContent = f"<p>Hi {partnerName},</p><p>You have been assigned a new student in UAN CRM.</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {studentId}" \
                                      f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                                      f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
                        sendMail('New Student Assigned', htmlContent, partnerMail)

                # '''Mail send to student'''
                # htmlContent = f"<p>Hi {firstName} {lastName},</p><p>Thank you for registering with us. Our team will get in touch with you soon.</p>" \
                #               f"<p>Thanks<br>UAN Team</p>"
                # sendMail('UAN Registration Successes', htmlContent, email)

                htmlContent = f"<p>Hi Admin,</p><p>{partnerName} has been assigned a new student.</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {studentId}" \
                              f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                              f"<p>Thanks<br>UAN Team</p>"
                sendMail('New Student Assigned', htmlContent, adminMail)

                addStudMsg.append('Sucessfully added partner student')

            statusUpdateMsg.append("Status updated")
        except mysql.Error as e:
            statusUpdateMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return statusUpdateMsg


class getPartnerReportApplicationCountASD(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        partnerIds = partnerId.split(",")
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        countryId = data["countryId"]
        countryIds = countryId.split(",")

        partnerReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in partnerIds and "All" in countryIds:
                sqlSelectASDReport = """
                                    SELECT  
                                        COUNT(application_id) AS application_count, 
                                        SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                        SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                        SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                        SUM(CASE WHEN offer_decision_type IS NULL THEN 1 ELSE 0 END) AS pending_application_count,
                                        partners.partner_id,
                                        partners.director_first_name,
                                        partners.director_last_name,
                                        SUM(CASE WHEN offer_decision_type = 'Withdrawn' THEN 1 ELSE 0 END) AS withdrawn_application_count,
                                        SUM(CASE WHEN offer_decision_type = 'Course Full' THEN 1 ELSE 0 END) AS coursefull_application_count,
                                        COUNT(DISTINCT application.student_id) AS applicants_count,
                                        SUM(CASE WHEN final_choiced = 1 THEN 1 ELSE 0 END) AS final_choice_count
                                    FROM 
                                        application 
                                    LEFT OUTER JOIN 
                                        students ON application.student_id = students.student_id 
                                    LEFT OUTER JOIN 
                                        partners ON partners.partner_id = students.partner_id 
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND students.partner_id IS NOT NULL
                                    GROUP BY 
                                        partners.partner_id
                                    """

                query_params = [fromDate, toDate]
            elif "All" in partnerIds and "All" not in countryIds:
                sqlSelectASDReport = """
                                       SELECT  
                                           COUNT(application_id) AS application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                           SUM(CASE WHEN offer_decision_type IS NULL THEN 1 ELSE 0 END) AS pending_application_count,
                                           partners.partner_id,
                                           partners.director_first_name,
                                           partners.director_last_name,
                                           SUM(CASE WHEN offer_decision_type = 'Withdrawn' THEN 1 ELSE 0 END) AS withdrawn_application_count,
                                           SUM(CASE WHEN offer_decision_type = 'Course Full' THEN 1 ELSE 0 END) AS coursefull_application_count,
                                           COUNT(DISTINCT application.student_id) AS applicants_count 
                                       FROM 
                                           application 
                                       LEFT OUTER JOIN 
                                           students ON application.student_id = students.student_id
                                       LEFT OUTER JOIN 
                                            partners ON partners.partner_id = students.partner_id  
                                       WHERE date_of_application_sent BETWEEN %s AND %s AND students.study_abroad_destination IN ({}) AND students.partner_id IS NOT NULL
                                       GROUP BY 
                                           partners.partner_id
                                       """
                countryIdsJoinData = ', '.join(['%s'] * len(countryIds))
                sqlSelectASDReport = sqlSelectASDReport.format(countryIdsJoinData)

                query_params = [fromDate, toDate] + countryIds
            elif "All" not in partnerIds and "All" in countryIds:
                sqlSelectASDReport = """
                                       SELECT  
                                           COUNT(application_id) AS application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                           SUM(CASE WHEN offer_decision_type IS NULL THEN 1 ELSE 0 END) AS pending_application_count,
                                           partners.partner_id,
                                           partners.director_first_name,
                                           partners.director_last_name,
                                           SUM(CASE WHEN offer_decision_type = 'Withdrawn' THEN 1 ELSE 0 END) AS withdrawn_application_count,
                                           SUM(CASE WHEN offer_decision_type = 'Course Full' THEN 1 ELSE 0 END) AS coursefull_application_count,
                                           COUNT(DISTINCT application.student_id) AS applicants_count,
                                           SUM(CASE WHEN final_choiced = 1 THEN 1 ELSE 0 END) AS final_choice_count
                                       FROM 
                                           application 
                                       LEFT OUTER JOIN 
                                           students ON application.student_id = students.student_id 
                                       LEFT OUTER JOIN 
                                           partners ON partners.partner_id = students.partner_id  
                                       WHERE date_of_application_sent BETWEEN %s AND %s AND students.partner_id IN ({}) AND students.partner_id IS NOT NULL
                                       GROUP BY 
                                           partners.partner_id
                                       """
                partnerIdsJoinData = ', '.join(['%s'] * len(partnerIds))
                sqlSelectASDReport = sqlSelectASDReport.format(partnerIdsJoinData)

                query_params = [fromDate, toDate] + partnerIds
            else:
                sqlSelectASDReport = """
                                       SELECT  
                                           COUNT(application_id) AS application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                           SUM(CASE WHEN offer_decision_type IS NULL THEN 1 ELSE 0 END) AS pending_application_count,
                                           partners.partner_id,
                                           partners.director_first_name,
                                           partners.director_last_name,
                                           SUM(CASE WHEN offer_decision_type = 'Withdrawn' THEN 1 ELSE 0 END) AS withdrawn_application_count,
                                           SUM(CASE WHEN offer_decision_type = 'Course Full' THEN 1 ELSE 0 END) AS coursefull_application_count,
                                           COUNT(DISTINCT application.student_id) AS applicants_count,
                                           SUM(CASE WHEN final_choiced = 1 THEN 1 ELSE 0 END) AS final_choice_count
                                       FROM 
                                           application 
                                       LEFT OUTER JOIN 
                                           students ON application.student_id = students.student_id
                                       LEFT OUTER JOIN 
                                           partners ON partners.partner_id = students.partner_id   
                                       WHERE date_of_application_sent BETWEEN %s AND %s AND students.partner_id IN ({}) AND students.study_abroad_destination IN ({}) AND students.partner_id IS NOT NULL
                                       GROUP BY 
                                           partners.partner_id
                                       """
                partnerIdsJoinData = ', '.join(['%s'] * len(partnerIds))
                countryIdsJoinData = ', '.join(['%s'] * len(countryIds))
                sqlSelectASDReport = sqlSelectASDReport.format(partnerIdsJoinData, countryIdsJoinData)

                query_params = [fromDate, toDate] + partnerIds + countryIds

            cursor.execute(sqlSelectASDReport, query_params)
            partnerReport_data = cursor.fetchall()
            if partnerReport_data:
                partnerReport = json.dumps(partnerReport_data, default=str)
            else:
                partnerReport.append('No data found')
        except mysql.Error as e:
            partnerReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerReport


class getPartnerReportApplicationCountCSD(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        partnerIds = partnerId.split(",")
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        countryId = data["countryId"]
        countryIds = countryId.split(",")

        partnerReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in partnerIds and "All" in countryIds:
                sqlSelectASDReport = """
                                    SELECT  
                                        COUNT(application_id) AS application_count, 
                                        SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                        SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                        SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                        SUM(CASE WHEN offer_decision_type IS NULL THEN 1 ELSE 0 END) AS pending_application_count,
                                        partners.partner_id,
                                        partners.director_first_name,
                                        partners.director_last_name,
                                        SUM(CASE WHEN offer_decision_type = 'Withdrawn' THEN 1 ELSE 0 END) AS withdrawn_application_count,
                                        SUM(CASE WHEN offer_decision_type = 'Course Full' THEN 1 ELSE 0 END) AS coursefull_application_count,
                                        COUNT(DISTINCT application.student_id) AS applicants_count,
                                        SUM(CASE WHEN final_choiced = 1 THEN 1 ELSE 0 END) AS final_choice_count
                                    FROM 
                                        application 
                                    LEFT OUTER JOIN 
                                        students ON application.student_id = students.student_id 
                                    LEFT OUTER JOIN 
                                           partners ON partners.partner_id = students.partner_id  
                                    WHERE course_start_date BETWEEN %s AND %s AND students.partner_id IS NOT NULL
                                    GROUP BY 
                                        partners.partner_id
                                    """

                query_params = [fromDate, toDate]
            elif "All" in partnerIds and "All" not in countryIds:
                sqlSelectASDReport = """
                                       SELECT  
                                           COUNT(application_id) AS application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                           SUM(CASE WHEN offer_decision_type IS NULL THEN 1 ELSE 0 END) AS pending_application_count,
                                           partners.partner_id,
                                           partners.director_first_name,
                                           partners.director_last_name,
                                           SUM(CASE WHEN offer_decision_type = 'Withdrawn' THEN 1 ELSE 0 END) AS withdrawn_application_count,
                                           SUM(CASE WHEN offer_decision_type = 'Course Full' THEN 1 ELSE 0 END) AS coursefull_application_count,
                                           COUNT(DISTINCT application.student_id) AS applicants_count,
                                           SUM(CASE WHEN final_choiced = 1 THEN 1 ELSE 0 END) AS final_choice_count
                                       FROM 
                                           application 
                                       LEFT OUTER JOIN 
                                           students ON application.student_id = students.student_id 
                                       LEFT OUTER JOIN 
                                           partners ON partners.partner_id = students.partner_id  
                                       WHERE course_start_date BETWEEN %s AND %s AND students.study_abroad_destination IN ({}) AND students.partner_id IS NOT NULL
                                       GROUP BY 
                                           partners.partner_id
                                       """
                countryIdsJoinData = ', '.join(['%s'] * len(countryIds))
                sqlSelectASDReport = sqlSelectASDReport.format(countryIdsJoinData)

                query_params = [fromDate, toDate] + countryIds
            elif "All" not in partnerIds and "All" in countryIds:
                sqlSelectASDReport = """
                                       SELECT  
                                           COUNT(application_id) AS application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                           SUM(CASE WHEN offer_decision_type IS NULL THEN 1 ELSE 0 END) AS pending_application_count,
                                           partners.partner_id,
                                           partners.director_first_name,
                                           partners.director_last_name,
                                           SUM(CASE WHEN offer_decision_type = 'Withdrawn' THEN 1 ELSE 0 END) AS withdrawn_application_count,
                                           SUM(CASE WHEN offer_decision_type = 'Course Full' THEN 1 ELSE 0 END) AS coursefull_application_count,
                                           COUNT(DISTINCT application.student_id) AS applicants_count,
                                           SUM(CASE WHEN final_choiced = 1 THEN 1 ELSE 0 END) AS final_choice_count
                                       FROM 
                                           application 
                                       LEFT OUTER JOIN 
                                           students ON application.student_id = students.student_id 
                                       LEFT OUTER JOIN 
                                           partners ON partners.partner_id = students.partner_id 
                                       WHERE course_start_date BETWEEN %s AND %s AND students.partner_id IN ({}) AND students.partner_id IS NOT NULL
                                       GROUP BY 
                                           partners.partner_id
                                       """
                partnerIdsJoinData = ', '.join(['%s'] * len(partnerIds))
                sqlSelectASDReport = sqlSelectASDReport.format(partnerIdsJoinData)

                query_params = [fromDate, toDate] + partnerIds
            else:
                sqlSelectASDReport = """
                                       SELECT  
                                           COUNT(application_id) AS application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                           SUM(CASE WHEN offer_decision_type IS NULL THEN 1 ELSE 0 END) AS pending_application_count,
                                           partners.partner_id,
                                           partners.director_first_name,
                                           partners.director_last_name,
                                           SUM(CASE WHEN offer_decision_type = 'Withdrawn' THEN 1 ELSE 0 END) AS withdrawn_application_count,
                                           SUM(CASE WHEN offer_decision_type = 'Course Full' THEN 1 ELSE 0 END) AS coursefull_application_count,
                                           COUNT(DISTINCT application.student_id) AS applicants_count,
                                           SUM(CASE WHEN final_choiced = 1 THEN 1 ELSE 0 END) AS final_choice_count
                                       FROM 
                                           application 
                                       LEFT OUTER JOIN 
                                           students ON application.student_id = students.student_id 
                                       LEFT OUTER JOIN 
                                           partners ON partners.partner_id = students.partner_id 
                                       WHERE course_start_date BETWEEN %s AND %s AND students.partner_id IN ({}) AND students.study_abroad_destination IN ({}) AND students.partner_id IS NOT NULL
                                       GROUP BY 
                                           partners.partner_id
                                       """
                partnerIdsJoinData = ', '.join(['%s'] * len(partnerIds))
                countryIdsJoinData = ', '.join(['%s'] * len(countryIds))
                sqlSelectASDReport = sqlSelectASDReport.format(partnerIdsJoinData, countryIdsJoinData)

                query_params = [fromDate, toDate] + partnerIds + countryIds

            cursor.execute(sqlSelectASDReport, query_params)
            partnerReport_data = cursor.fetchall()
            if partnerReport_data:
                partnerReport = json.dumps(partnerReport_data, default=str)
            else:
                partnerReport.append('No data found')
        except mysql.Error as e:
            partnerReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerReport


class getPartnerReportApplicationsASD(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        partnerIds = partnerId.split(",")
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        countryId = data["countryId"]
        countryIds = countryId.split(",")

        partnerReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in partnerIds and "All" in countryIds:
                sqlSelectASDReport = """
                                        SELECT students.student_id AS student_id, course_name, first_name, last_name, 
                                        date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                        students.email, lead_source, utm_source,partners.director_first_name,
                                        partners.director_last_name,partners.contract_done,students.study_abroad_destination FROM application 
                                        LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                        LEFT OUTER JOIN partners ON partners.partner_id = students.partner_id 
                                        WHERE date_of_application_sent BETWEEN %s AND %s AND students.partner_id IS NOT NULL
                                        ORDER BY date_of_application_sent"""
                query_params = [fromDate, toDate, ]
            elif "All" in partnerIds and "All" not in countryIds:
                sqlSelectASDReport = """
                                        SELECT students.student_id AS student_id, course_name, first_name, last_name, 
                                        date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                        students.email, lead_source, utm_source, partners.director_first_name,
                                        partners.director_last_name,partners.contract_done,students.study_abroad_destination FROM application 
                                        LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                        LEFT OUTER JOIN partners ON partners.partner_id = students.partner_id 
                                        WHERE date_of_application_sent BETWEEN %s AND %s 
                                        AND students.study_abroad_destination IN ({}) AND students.partner_id IS NOT NULL
                                        ORDER BY date_of_application_sent"""
                countryIdsJoinData = ', '.join(['%s'] * len(countryIds))
                sqlSelectASDReport = sqlSelectASDReport.format(countryIdsJoinData)

                query_params = [fromDate, toDate] + countryIds
            elif "All" not in partnerIds and "All" in countryIds:
                sqlSelectASDReport = """
                                        SELECT students.student_id AS student_id, course_name, first_name, last_name, 
                                        date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                        students.email, lead_source, utm_source, partners.director_first_name,
                                        partners.director_last_name,partners.contract_done,students.study_abroad_destination FROM application 
                                        LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                        LEFT OUTER JOIN partners ON partners.partner_id = students.partner_id 
                                        WHERE date_of_application_sent BETWEEN %s AND %s 
                                        AND students.partner_id IN ({}) AND students.partner_id IS NOT NULL
                                        ORDER BY date_of_application_sent"""
                partnerIdsJoinData = ', '.join(['%s'] * len(partnerIds))
                sqlSelectASDReport = sqlSelectASDReport.format(partnerIdsJoinData)

                query_params = [fromDate, toDate] + partnerIds

            else:
                sqlSelectASDReport = """
                                        SELECT students.student_id AS student_id, course_name, first_name, last_name, 
                                        date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                        students.email, lead_source, utm_source,partners.director_first_name,
                                        partners.director_last_name,partners.contract_done,students.study_abroad_destination FROM application 
                                        LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                        LEFT OUTER JOIN partners ON partners.partner_id = students.partner_id 
                                        WHERE date_of_application_sent BETWEEN %s AND %s 
                                        AND students.partner_id IN ({}) AND students.study_abroad_destination IN ({}) AND students.partner_id IS NOT NULL
                                        ORDER BY date_of_application_sent"""

                partnerIdsJoinData = ', '.join(['%s'] * len(partnerIds))
                countryIdsJoinData = ', '.join(['%s'] * len(countryIds))
                sqlSelectASDReport = sqlSelectASDReport.format(partnerIdsJoinData, countryIdsJoinData)

                query_params = [fromDate, toDate] + partnerIds + countryIds

            cursor.execute(sqlSelectASDReport, query_params)
            partnerReport_data = cursor.fetchall()
            if partnerReport_data:
                partnerReport = json.dumps(partnerReport_data, default=str)
            else:
                partnerReport.append('No data found')
        except mysql.Error as e:
            partnerReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerReport


class getPartnerReportApplicationsCSD(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        partnerIds = partnerId.split(",")
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        countryId = data["countryId"]
        countryIds = countryId.split(",")

        partnerReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in partnerIds and "All" in countryIds:
                sqlSelectASDReport = """
                                        SELECT students.student_id AS student_id, course_name, first_name, last_name, 
                                        date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                        students.email, lead_source, utm_source, partners.director_first_name,
                                        partners.director_last_name,partners.contract_done,students.study_abroad_destination FROM application 
                                        LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                        LEFT OUTER JOIN partners ON partners.partner_id = students.partner_id 
                                        WHERE course_start_date BETWEEN %s AND %s AND students.partner_id IS NOT NULL
                                        ORDER BY course_start_date"""
                query_params = [fromDate, toDate, ]
            elif "All" in partnerIds and "All" not in countryIds:
                sqlSelectASDReport = """
                                        SELECT students.student_id AS student_id, course_name, first_name, last_name,
                                        date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                        students.email, lead_source, utm_source, partners.director_first_name,
                                        partners.director_last_name,partners.contract_done,students.study_abroad_destination FROM application 
                                        LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                        LEFT OUTER JOIN partners ON partners.partner_id = students.partner_id 
                                        WHERE course_start_date BETWEEN %s AND %s 
                                        AND students.study_abroad_destination IN ({}) AND students.partner_id IS NOT NULL
                                        ORDER BY course_start_date"""
                countryIdsJoinData = ', '.join(['%s'] * len(countryIds))
                sqlSelectASDReport = sqlSelectASDReport.format(countryIdsJoinData)

                query_params = [fromDate, toDate] + countryIds
            elif "All" not in partnerIds and "All" in countryIds:
                sqlSelectASDReport = """
                                        SELECT students.student_id AS student_id, course_name, first_name, last_name,
                                        date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                        students.email, lead_source, utm_source, partners.director_first_name,
                                        partners.director_last_name,partners.contract_done,students.study_abroad_destination FROM application 
                                        LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                        LEFT OUTER JOIN partners ON partners.partner_id = students.partner_id 
                                        WHERE course_start_date BETWEEN %s AND %s 
                                        AND students.partner_id IN ({}) AND students.partner_id IS NOT NULL
                                        ORDER BY course_start_date"""
                partnerIdsJoinData = ', '.join(['%s'] * len(partnerIds))
                sqlSelectASDReport = sqlSelectASDReport.format(partnerIdsJoinData)

                query_params = [fromDate, toDate] + partnerIds

            else:
                sqlSelectASDReport = """
                                        SELECT students.student_id AS student_id, course_name, first_name, last_name,
                                        date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                        students.email, lead_source, utm_source, partners.director_first_name,
                                        partners.director_last_name,partners.contract_done,students.study_abroad_destination FROM application 
                                        LEFT OUTER JOIN students ON students.student_id = application.student_id
                                        LEFT OUTER JOIN partners ON partners.partner_id = students.partner_id  
                                        WHERE course_start_date BETWEEN %s AND %s 
                                        AND students.partner_id IN ({}) AND students.study_abroad_destination IN ({}) AND students.partner_id IS NOT NULL
                                        ORDER BY course_start_date"""

                partnerIdsJoinData = ', '.join(['%s'] * len(partnerIds))
                countryIdsJoinData = ', '.join(['%s'] * len(countryIds))
                sqlSelectASDReport = sqlSelectASDReport.format(partnerIdsJoinData, countryIdsJoinData)

                query_params = [fromDate, toDate] + partnerIds + countryIds

            cursor.execute(sqlSelectASDReport, query_params)
            partnerReport_data = cursor.fetchall()
            if partnerReport_data:
                partnerReport = json.dumps(partnerReport_data, default=str)
            else:
                partnerReport.append('No data found')
        except mysql.Error as e:
            partnerReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerReport


class getYearlyPartnerProfilePerformance(Resource):
    def post(self):
        data = request.get_json(force=True)
        partnerId = data["partnerId"]
        current_year = data["year"]
        previous_year = int(current_year) - 1

        partnerReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectPartnerPerformance = """
                        SELECT  
                        partners.partner_id,
                        partners.director_first_name,
                        partners.director_last_name,
                        COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END) AS current_year_application_count, 
                        COUNT(DISTINCT CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END) AS current_year_applicants_count,
                        SUM(CASE WHEN YEAR(application.created_date) = %s AND final_choiced = 1 THEN 1 ELSE 0 END) AS current_year_final_choice_count,
                        COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END) AS previous_year_application_count,
                        COUNT(DISTINCT CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END) AS previous_year_applicants_count,
                        SUM(CASE WHEN YEAR(application.created_date) = %s AND final_choiced = 1 THEN 1 ELSE 0 END) AS previous_year_final_choice_count,
                       IF(
                            COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END) >= COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END),
                            ((COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END) - COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END)) / NULLIF(COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END), 0)) * 100,
                            -(((COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END) - COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END)) / NULLIF(COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END), 0)) * 100)
                        ) AS application_count_difference_percentage,
                        IF(
                            COUNT(CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END) >= COUNT(CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END),
                            ((COUNT(DISTINCT CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END) - COUNT(DISTINCT CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END)) / NULLIF(COUNT(DISTINCT CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END), 0)) * 100,
                            -(((COUNT(DISTINCT CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END) - COUNT(DISTINCT CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END)) / NULLIF(COUNT(DISTINCT CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END), 0)) * 100)
                        ) AS student_count_difference_percentage,
                        IF(
                            COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END) >= COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END),
                            ((SUM(CASE WHEN YEAR(application.created_date) = %s AND final_choiced = 1 THEN 1 ELSE 0 END) - SUM(CASE WHEN YEAR(application.created_date) = %s THEN application_id END)) / NULLIF(SUM(CASE WHEN YEAR(application.created_date) = %s AND final_choiced = 1 THEN 1 ELSE 0 END), 0)) * 100,
                            -(((SUM(CASE WHEN YEAR(application.created_date) = %s AND final_choiced = 1 THEN 1 ELSE 0 END) - SUM(CASE WHEN YEAR(application.created_date) = %s THEN application_id END)) / NULLIF(SUM(CASE WHEN YEAR(application.created_date) = %s AND final_choiced = 1 THEN 1 ELSE 0 END), 0)) * 100)
                        ) AS final_choice_count_difference_percentage
                        FROM 
                            application 
                        LEFT OUTER JOIN 
                            students ON application.student_id = students.student_id 
                        LEFT OUTER JOIN 
                            partners ON partners.partner_id = students.partner_id 
                        WHERE 
                            partners.partner_id = %s
                            AND students.partner_id IS NOT NULL 
                        GROUP BY 
                            partners.partner_id
                                    """

            query_params = [current_year, current_year, current_year, previous_year, previous_year, previous_year,
                            current_year, previous_year, current_year, previous_year, previous_year, previous_year,
                            current_year, previous_year, current_year, previous_year, current_year, previous_year,
                            previous_year, previous_year, current_year, previous_year, current_year, previous_year,
                            current_year, previous_year, previous_year, previous_year, current_year, previous_year,
                            partnerId]
            cursor.execute(sqlSelectPartnerPerformance, query_params)
            partnerReport_data = cursor.fetchall()
            if partnerReport_data:
                partnerReport = json.dumps(partnerReport_data, default=str)
            else:
                partnerReport.append('No data found')
        except mysql.Error as e:
            partnerReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return partnerReport


class getManagerUsers(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        users = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectUsers = """select user_id, name, office_name, role, username,password_str, users.created_date, 
                                count(students.counsilor_id) as studentsCount, users.deactivate, users.email from users 
                                inner join offices on users.office_id=offices.office_id 
                                left outer join students on users.user_id=students.counsilor_id 
                                WHERE users.role != 'partner' AND users.office_id= %s
                                group by students.counsilor_id, users.name, users.user_id, offices.office_name, users.role, 
                                users.username, users.password_str, users.created_date"""
            valSelectUsers = (officeId,)
            cursor.execute(sqlSelectUsers, valSelectUsers)
            users_data = cursor.fetchall()
            if users_data:
                users = json.dumps(users_data, default=str)
            else:
                users.append('No data found')
        except mysql.Error as e:
            users.append(str(e))
        finally:
            cursor.close()

        return users


class getManagerStaffCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        staffCount = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            # Count active users
            cursor.execute("SELECT COUNT(*) FROM users WHERE deactivate = 0 and role!='partner' and office_id=%s",
                           (officeId,))
            active_count = cursor.fetchone()[0]

            # Count inactive users
            cursor.execute("SELECT COUNT(*) FROM users WHERE deactivate = 1 and role!='partner' and office_id=%s",
                           (officeId,))
            inactive_count = cursor.fetchone()[0]

            staffCount.append({'active_count': active_count, 'inactive_count': inactive_count})
        except mysql.Error as e:
            staffCount.append(str(e))
        finally:
            cursor.close()

        return staffCount


class bulkAssignStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        counsilorId = data["counsilorId"]
        studentId = data["studentId"]
        studentIds = studentId.split(",")

        reAssignMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlUpdateNote = (
                "update students set office_id=%s, counsilor_id=%s where student_id in ({})".format(
                    ','.join(['%s'] * len(studentIds)))
            )
            value = [officeId, counsilorId] + studentIds
            cursor.execute(sqlUpdateNote, value)
            reAssignMsg.append("Students are assigned")

            sqlGetStudent = "select first_name, last_name, student_id from students where student_id in ({})".format(
                ','.join(['%s'] * len(studentIds)))
            cursor.execute(sqlGetStudent, studentIds)
            studentDetail = cursor.fetchall()

            students = ""
            for row in studentDetail:
                first_name, last_name, student_id = row
                students += f"Student Name: {first_name} {last_name}, Student Id: {student_id} <br>"

            sqlGetCounselorName = """select name, username from users where user_id=%s"""
            value = (counsilorId,)
            cursor.execute(sqlGetCounselorName, value)
            counselorDetail = cursor.fetchone()
            counselorName = counselorDetail[0]
            counselorMail = counselorDetail[1]

            htmlContent = f"<p>Hi {counselorName},</p><p>You have been assigned new students</p><p>{students}</p>" \
                          f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
            sendMail('New Student Assigned', htmlContent, counselorMail)

            sqlGetManager = """select name, username, office_id from users where office_id=%s and role=%s AND username != 'rajindersingh@uan-networks.com'"""
            value = (officeId, "manager",)
            cursor.execute(sqlGetManager, value)
            managerDetails = cursor.fetchall()
            if (managerDetails):
                for managerDetail in managerDetails:
                    managerName = managerDetail[0]
                    managerMail = managerDetail[1]
                    managerOfficeId = managerDetail[2]
                    if managerOfficeId != officeId:
                        htmlContent = f"<p>Hi {managerName},</p><p>Your office has been assigned new students</p>" \
                                      f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
                        sendMail('New Student Added', htmlContent, managerMail)
            reAssignMsg.append('Sucessfully Sent Email')

        except mysql.Error as e:
            reAssignMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return reAssignMsg


class managerBulkAssignStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        counsilorId = data["counsilorId"]
        studentId = data["studentId"]
        studentIds = studentId.split(",")

        reAssignMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlUpdateNote = (
                "update students set office_id=%s, counsilor_id=%s where student_id in ({})".format(
                    ','.join(['%s'] * len(studentIds)))
            )
            value = [officeId, counsilorId] + studentIds
            cursor.execute(sqlUpdateNote, value)
            reAssignMsg.append("Students are assigned")

            sqlGetStudent = "select first_name, last_name, student_id from students where student_id in ({})".format(
                ','.join(['%s'] * len(studentIds)))
            cursor.execute(sqlGetStudent, studentIds)
            studentDetail = cursor.fetchall()

            students = ""
            for row in studentDetail:
                first_name, last_name, student_id = row
                students += f"Student Name: {first_name} {last_name}, Student Id: {student_id} <br>"

            sqlGetCounselorName = """select name, username from users where user_id=%s"""
            value = (counsilorId,)
            cursor.execute(sqlGetCounselorName, value)
            counselorDetail = cursor.fetchone()
            counselorName = counselorDetail[0]
            counselorMail = counselorDetail[1]

            htmlContent = f"<p>Hi {counselorName},</p><p>You have been assigned new students</p><p>{students}</p>" \
                          f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
            sendMail('New Student Assigned', htmlContent, counselorMail)

            sqlGetManager = """select name, username, office_id from users where office_id=%s and role=%s AND username != 'rajindersingh@uan-networks.com'"""
            value = (officeId, "manager",)
            cursor.execute(sqlGetManager, value)
            managerDetails = cursor.fetchall()
            if (managerDetails):
                for managerDetail in managerDetails:
                    managerName = managerDetail[0]
                    managerMail = managerDetail[1]
                    managerOfficeId = managerDetail[2]
                    if managerOfficeId != officeId:
                        htmlContent = f"<p>Hi {managerName},</p><p>Your office has been assigned new students</p>" \
                                      f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
                        sendMail('New Student Added', htmlContent, managerMail)
            reAssignMsg.append('Sucessfully Sent Email')

        except mysql.Error as e:
            reAssignMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return reAssignMsg


class studentDocumentUpload(Resource):
    def post(self):
        file = request.files["file"]
        studentId = request.form["studentId"]
        filename = secure_filename(file.filename)
        uploadFile = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            file.save(os.path.join(CONTRACT_FOLDER, filename))
            uploadFile.append('File uploaded Successfully\n')
            try:
                sqlAddContractFile = """insert into student_document (student_document, student_id) values (%s, %s)"""
                value = (filename, studentId,)
                cursor.execute(sqlAddContractFile, value)
                last_insert_id = cursor.lastrowid
                uploadFile.append('File Added')
                uploadFile.append(last_insert_id)
            except mysql.Error as e:
                uploadFile.append(str(e))
            finally:
                cnx.commit()
                cursor.close()
        except OSError as e:
            uploadFile.append(str(e))

        return uploadFile


class getStudentDocumentList(Resource):
    def post(self):
        data = request.get_json(force=True)
        studentId = data["studentId"]
        studentDocument = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetStudentDocument = """select student_id, student_document from students where student_id= %s order by student_id asc"""
            value = (studentId,)
            cursor.execute(sqlGetStudentDocument, value)
            studentDocument = cursor.fetchall()
            if studentDocument:
                studentDocument = json.dumps(studentDocument, default=str)
            else:
                studentDocument.append('No data found')
        except mysql.Error as e:
            studentDocument.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return studentDocument


class updateStudentDocument(Resource):
    def post(self):
        data = request.get_json(force=True)
        studentId = data["studentId"]
        contractFiles = data["contractFiles"]

        institution = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlUpdateInstitution = """update students set student_document=%s where student_id=%s"""
            value = (contractFiles, studentId,)
            cursor.execute(sqlUpdateInstitution, value)
            institution.append('Contract Files Updated')
        except mysql.Error as e:
            institution.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return institution


class getStudentDocument(Resource):
    def post(self):
        data = request.get_json(force=True)
        # fileName = data["fileName"]
        # fileName = data["fileName"].replace(" ", "_")
        fileName = re.sub(r'\s+', '_', data["fileName"])  # Replace multiple spaces with underscores
        fileType = ""
        try:
            base64_files = []  # Initialize a list to store the Base64-encoded images
            file_path = os.path.join(CONTRACT_FOLDER, fileName)

            # Check if the file exists
            image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tif', '.tiff'}
            if os.path.exists(file_path) and os.path.splitext(file_path)[1].lower() in image_extensions:
                with open(file_path, 'rb') as image_file:
                    image_contents = image_file.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_image = base64.b64encode(image_contents).decode('utf-8')
                    base64_files.append(base64_image)
                fileType = "image"
            elif os.path.exists(file_path) and os.path.splitext(file_path)[1].lower() == '.pdf':
                # Open and read the file
                with open(file_path, 'rb') as file_to_read:
                    file_contents = file_to_read.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_pdf = base64.b64encode(file_contents).decode('utf-8')
                    base64_files.append(base64_pdf)
                fileType = "pdf"
            elif os.path.exists(file_path) and (os.path.splitext(file_path)[1].lower() == '.xlsx'
                                                or os.path.splitext(file_path)[1].lower() == '.xls'):
                # Open and read the Excel file
                with open(file_path, 'rb') as excel_file:
                    excel_contents = excel_file.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_excel = base64.b64encode(excel_contents).decode('utf-8')
                    base64_files.append(base64_excel)
                fileType = "xl"
            elif os.path.exists(file_path) and os.path.splitext(file_path)[1].lower() == '.csv':
                # Open and read the CSV file
                with open(file_path, 'rb') as csv_file:
                    csv_contents = csv_file.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_csv = base64.b64encode(csv_contents).decode('utf-8')
                    base64_files.append(base64_csv)
                fileType = "csv"
            else:
                base64_files.append('')
                fileType = ""
        except mysql.Error as e:
            staffDet.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return [base64_files, fileType]


class getCounsellorMissedReminderReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        toDate = datetime.strptime(toDate, '%Y-%m-%d')
        toDate = toDate + timedelta(days=1)
        toDate = toDate.strftime('%Y-%m-%d')
        officeId = data["officeId"]
        officeIds = officeId.split(",")
        countryOfIntrest = data["countryOfIntrest"]
        countryOfIntrests = countryOfIntrest.split(",")
        staff = data["staff"]
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        missedReminderReport = []
        cursor = cnx.cursor()
        try:
            if "All" in officeIds and "All" in countryOfIntrests:
                sqlgetReminderReport = """
                                        SELECT notes.counsilor_id, users.name, COUNT(notes.note_id) AS note_count FROM notes 
                                        LEFT JOIN users ON users.user_id = notes.counsilor_id 
                                        LEFT JOIN students ON students.student_id = notes.student_id 
                                        WHERE reminder_date <= CURDATE() AND notes.status = 1 AND 
                                        students.status not in ("Inactive", "Closed")
                                        AND notes.created_date BETWEEN %s AND %s AND notes.counsilor_id = %s GROUP BY notes.counsilor_id
                                        """
                query_params = [fromDate, toDate] + [staff]

            elif "All" in officeIds and "All" not in countryOfIntrests:
                sqlgetReminderReport = """
                                        SELECT notes.counsilor_id, users.name, COUNT(notes.note_id) AS note_count FROM notes 
                                        LEFT JOIN users ON users.user_id = notes.counsilor_id 
                                        LEFT JOIN students ON students.student_id = notes.student_id 
                                        WHERE reminder_date <= CURDATE() AND notes.status = 1 AND 
                                        students.status not in ("Inactive", "Closed") AND 
                                        notes.created_date BETWEEN %s AND %s AND 
                                        study_abroad_destination IN ({}) AND notes.counsilor_id = %s GROUP BY notes.counsilor_id
                                        """
                countryOfIntrestJoinData = ', '.join(['%s'] * len(countryOfIntrests))

                sqlgetReminderReport = sqlgetReminderReport.format(countryOfIntrestJoinData)

                query_params = [fromDate, toDate] + countryOfIntrests + [staff]
            elif "All" not in officeIds and "All" in countryOfIntrests:
                sqlgetReminderReport = """
                                        SELECT notes.counsilor_id, users.name, COUNT(notes.note_id) AS note_count FROM notes 
                                        LEFT JOIN users ON users.user_id = notes.counsilor_id 
                                        LEFT JOIN students ON students.student_id = notes.student_id 
                                        WHERE reminder_date <= CURDATE() AND notes.status = 1 AND 
                                        students.status not in ("Inactive", "Closed") AND
                                        notes.created_date BETWEEN %s AND %s AND users.office_id IN ({}) AND notes.counsilor_id = %s
                                        GROUP BY notes.counsilor_id
                                        """
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))

                sqlgetReminderReport = sqlgetReminderReport.format(officeIdJoinData)

                query_params = [fromDate, toDate] + officeIds + [staff]
            else:
                sqlgetReminderReport = """
                                    SELECT notes.counsilor_id, users.name, COUNT(notes.note_id) AS note_count FROM notes 
                                    LEFT JOIN users ON users.user_id = notes.counsilor_id 
                                    LEFT JOIN students ON students.student_id = notes.student_id 
                                    WHERE reminder_date <= CURDATE() AND notes.status = 1 AND 
                                    students.status not in ("Inactive", "Closed") AND
                                    notes.created_date BETWEEN %s AND %s AND users.office_id IN ({}) AND 
                                    study_abroad_destination IN ({}) AND notes.counsilor_id = %s GROUP BY notes.counsilor_id
                                    """

                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                countryOfIntrestJoinData = ', '.join(['%s'] * len(countryOfIntrests))

                sqlgetReminderReport = sqlgetReminderReport.format(officeIdJoinData, countryOfIntrestJoinData)

                query_params = [fromDate, toDate] + officeIds + countryOfIntrests + [staff]

            cursor.execute(sqlgetReminderReport, query_params)
            missedReport = cursor.fetchall()

            if missedReport:
                missedReminderReport = json.dumps(missedReport, default=str)
            else:
                missedReminderReport.append('No data found')
        except mysql.Error as e:
            missedReminderReport.append(str(e))
        finally:
            cursor.close()
        return missedReminderReport


class addFranchise(Resource):
    def post(self):
        data = request.get_json(force=True)
        companyName = data["companyName"]
        companyWebsite = data["companyWebsite"]
        directorFirstName = data["directorFirstName"]
        directorLastName = data["directorLastName"]
        directorEmail = data["directorEmail"]
        countryCode = data["countryCode"]
        directorContactNumber = data["directorContactNumber"]
        postalAddress = data["postalAddress"]
        city = data["city"]
        country = data["country"]
        bdm = data["bdm"]
        consultantAssigned = data["consultantAssigned"]
        contractDone = data["contractDone"]
        processingOffice = data["processingOffice"]

        addFranchiseMsg = []

        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlFranchiseAdd = """insert into franchise(company_name, company_website, director_first_name, director_last_name, 
                            director_email, country_code, director_contact_number, postal_address, city, country, bdm, consultant_assigned, 
                            contract_done, processing_office)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            valFranchiseAdd = (
            companyName, companyWebsite, directorFirstName, directorLastName, directorEmail, countryCode,
            directorContactNumber,
            postalAddress, city, country, bdm, consultantAssigned, contractDone, processingOffice,)
            cursor.execute(sqlFranchiseAdd, valFranchiseAdd)
            addFranchiseMsg.append("Sucessfully Added the Franchise")

        except mysql.Error as e:
            addFranchiseMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return addFranchiseMsg


class getFranchiseDetails(Resource):
    def get(self):
        franchiseDetails = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetFranchiseDetails = """select franchise.franchise_id, company_name, company_website, director_first_name, director_last_name, 
                                    director_email, country, offices.office_name, consultant_assigned_user.name AS 
                                    consultant_assigned_username, bdm_user.name AS bdm_username, contract_done_user.name AS 
                                    contract_done_username from franchise 
                                    left outer join offices on offices.office_id = franchise.processing_office 
                                    left outer join users as bdm_user on bdm_user.user_id = franchise.bdm 
                                    left outer join users as contract_done_user on contract_done_user.user_id = franchise.contract_done 
                                    left outer join users as consultant_assigned_user on consultant_assigned_user.user_id = franchise.consultant_assigned 
                                    order by franchise_id desc"""
            cursor.execute(sqlGetFranchiseDetails)
            franchiseDetail = cursor.fetchall()
            if franchiseDetail:
                franchiseDetails = json.dumps(franchiseDetail, default=str)
            else:
                franchiseDetails.append('No data found')

        except mysql.Error as e:
            franchiseDetails.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseDetails


class getFranchises(Resource):
    def get(self):
        franchiseDetails = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetFranchiseDetails = """select franchise_id, company_name from franchise order by franchise_id asc"""
            cursor.execute(sqlGetFranchiseDetails)
            franchiseDetail = cursor.fetchall()
            if franchiseDetail:
                franchiseDetails = json.dumps(franchiseDetail, default=str)
            else:
                franchiseDetails.append('No data found')

        except mysql.Error as e:
            franchiseDetails.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseDetails


class getFranchiseWithId(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        franchiseDetails = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetFranchiseDetails = """select franchise_id, company_name, company_website, director_first_name, director_last_name, 
                                    director_email, country_code, director_contact_number, postal_address, city, country, bdm, consultant_assigned, 
                                    contract_done, processing_office, commission_rate from franchise where franchise_id=%s"""
            value = (franchiseId,)
            cursor.execute(sqlGetFranchiseDetails, value)
            franchiseDetail = cursor.fetchall()
            if franchiseDetail:
                franchiseDetails = json.dumps(franchiseDetail, default=str)
            else:
                franchiseDetails.append('No data found')
        except mysql.Error as e:
            franchiseDetails.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseDetails


class getStudentLogNotes(Resource):
    def post(self):
        data = request.get_json(force=True)
        student_id = data["studentId"]
        studentNotes = []

        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectStud = """SELECT name, note, contact_type, lead_source, notes.created_date, notes.status, reminder_date, note_id FROM notes 
                            left outer join users on users.user_id=notes.counsilor_id WHERE student_id=%s AND (contact_type = 'Phone' OR contact_type = 'Email') order by note_id desc"""
            value = (student_id,)
            cursor.execute(sqlSelectStud, value)
            students_data = cursor.fetchall()
            if students_data:
                studentNotes = json.dumps(students_data, default=str)
            else:
                studentNotes.append('No data found')
        except mysql.Error as e:
            studentNotes.append(str(e))
        finally:
            cursor.close()

        return studentNotes


class getStudentActivityLogNotes(Resource):
    def post(self):
        data = request.get_json(force=True)
        student_id = data["studentId"]
        studentNotes = []

        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectStud = """SELECT name, note, contact_type, lead_source, notes.created_date, notes.status, reminder_date, note_id FROM notes 
                            left outer join users on users.user_id=notes.counsilor_id WHERE student_id=%s AND contact_type NOT IN ('Phone', 'Email') order by note_id desc"""
            value = (student_id,)
            cursor.execute(sqlSelectStud, value)
            students_data = cursor.fetchall()
            if students_data:
                studentNotes = json.dumps(students_data, default=str)
            else:
                studentNotes.append('No data found')
        except mysql.Error as e:
            studentNotes.append(str(e))
        finally:
            cursor.close()

        return studentNotes


class getFranchisePassword(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        franchisePassword = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetFranchisePassword = """select password_str FROM users WHERE franchise_id = %s"""
            value = (franchiseId,)
            cursor.execute(sqlGetFranchisePassword, value)
            franchisePassword = cursor.fetchall()
            if franchisePassword:
                franchisePassword = json.dumps(franchisePassword, default=str)
            else:
                franchisePassword.append('No data found')
        except mysql.Error as e:
            franchisePassword.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchisePassword


class updateFranchiseCredential(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        passwordStr = data["password"]
        franchiseCredential = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            password_key = Fernet.generate_key()
            fernet = Fernet(password_key)
            password = fernet.encrypt(passwordStr.encode())

            sqlUpdateCredential = """update users set password=%s, 
                                                password_str=%s, password_key=%s where franchise_id=%s"""
            value = (password, passwordStr, password_key, franchiseId,)
            cursor.execute(sqlUpdateCredential, value)
            franchiseCredential.append('Franchise credential updated')
        except mysql.Error as e:
            franchiseCredential.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseCredential


class sendFranchiseCredential(Resource):
    def post(self):
        data = request.get_json(force=True)
        name = data["name"]
        email = data["email"]
        password = data["password"]
        franchiseCredential = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            htmlContent = f"<p>Hi {name},</p><p>Your account credentials are as follows</p><p>Username :- {email} <br>Password:- {password}" \
                          f"</p>" \
                          f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
            sendMail('Account Credentials', htmlContent, email)
            franchiseCredential.append('Franchise credential sent')
        except mysql.Error as e:
            franchiseCredential.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseCredential


class addFranchiseStudent(Resource):
    def post(self):
        data = request.get_json(force=True)
        firstName = data['firstName']
        lastName = data['lastName']
        countryCode = data["countryCode"]
        phone = data['phone']
        email = data['email']
        office = data['office']
        franchise = data['franchise']
        nationality = data['nationality']
        dob = data['dob']
        leadSource = data['leadSource']
        studyAbroadDestination = data["studyAbroadDestination"]
        addStudMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlStudentAdd = """insert into students(office_id, franchises_id, first_name, last_name, country_code, mobile_no, email, lead_source, 
                            nationality, dob, status, study_abroad_destination)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            valStudAdd = (office, franchise, firstName, lastName, countryCode, phone, email, leadSource, nationality,
                          dob, "Lead", studyAbroadDestination,)
            cursor.execute(sqlStudentAdd, valStudAdd)
            last_insert_id = cursor.lastrowid

            sqlAddNote = """insert into notes(student_id, franchise_ids, note, contact_type, lead_source)
                                                    values (%s, %s, %s, %s, %s)"""
            value = (last_insert_id, franchise, "Lead added via Add student", leadSource, "")
            cursor.execute(sqlAddNote, value)

            sqlGetManager = """select name, username from users where office_id=%s and role=%s and franchise_id = %s AND username != 'rajindersingh@uan-networks.com'"""
            value = (office, "franchise", franchise)
            cursor.execute(sqlGetManager, value)
            managerDetails = cursor.fetchall()
            if (managerDetails):
                for managerDetail in managerDetails:
                    managerName = managerDetail[0]
                    managerMail = managerDetail[1]
                    htmlContent = f"<p>Hi {managerName},</p><p>You have added a new student in UAN CRM.</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {last_insert_id}" \
                                  f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                                  f"<p>Please <a href='http://crm.uan-network.com/'>click here</a> to login and see more details</p><br><p>Thanks<br>UAN Team</p>"
                    sendMail('Registration form Student Added', htmlContent, managerMail)

            '''Mail send to student'''
            htmlContent = f"<p>Hi {firstName} {lastName},</p><p>Thank you for registering with us. Our team will get in touch with you soon.</p>" \
                          f"<p>Thanks<br>UAN Team</p>"
            sendMail('UAN Registration Successes', htmlContent, email)

            htmlContent = f"<p>Hi Admin,</p><p>You have a new student registration</p><p>Student Name :- {firstName} {lastName}<br>Student id:- {last_insert_id}" \
                          f"<br>Mobile :- {phone}<br>Email :- {email} <br>Nationality :- {nationality}</p>" \
                          f"<p>Thanks<br>UAN Team</p>"
            sendMail('Registration form Student Added', htmlContent, adminMail)

            addStudMsg.append('Sucessfully added franchise student')
        except mysql.Error as e:
            addStudMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return addStudMsg


class getCountOfFranchiseDashboard(Resource):
    def post(self):
        data = request.get_json(force=True)
        year = data["year"]
        franchiseId = data["franchiseId"]
        dashboardCount = [];
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetStudCount = """SELECT count(*) FROM students WHERE YEAR(created_date)=%s and franchises_id=%s"""
            value = (year, franchiseId,)
            cursor.execute(sqlGetStudCount, value)
            studentCount = cursor.fetchall()
            if studentCount:
                dashboardCount.append(studentCount)
            else:
                dashboardCount.append('No data found')

            sqlGetApplicationCount = """select count(*) from application inner join students on application.student_id=students.student_id 
            where YEAR(application.course_start_date)=%s and franchises_id=%s"""
            value = (year, franchiseId,)
            cursor.execute(sqlGetApplicationCount, value)
            applicationCount = cursor.fetchall()
            if applicationCount:
                dashboardCount.append(applicationCount)
            else:
                dashboardCount.append('No data found')

            sqlGetFinalChoiceCount = """select count(*) from application inner join students on application.student_id=students.student_id 
                            where final_choiced=1 and YEAR(application.course_start_date)=%s and franchises_id=%s"""
            value = (year, franchiseId,)
            cursor.execute(sqlGetFinalChoiceCount, value)
            finalChoiceCount = cursor.fetchall()
            if finalChoiceCount:
                dashboardCount.append(finalChoiceCount)
            else:
                dashboardCount.append('No data found')

            sqlGetUnAssignedLeadsCount = """select count(*) from students where counsilor_id is null and YEAR(created_date)=%s and franchises_id=%s"""
            value = (year, franchiseId,)
            cursor.execute(sqlGetUnAssignedLeadsCount, value)
            unAssignedLeadsCount = cursor.fetchall()
            if unAssignedLeadsCount:
                dashboardCount.append(unAssignedLeadsCount)
            else:
                dashboardCount.append('No data found')
        except mysql.Error as e:
            dashboardCount.append(str(e))
        finally:
            cursor.close()

        return dashboardCount


class getAllFranchiseStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        status = data["status"]
        status = status.capitalize()
        students = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if (status == "Unassigned"):
                sqlGetStudents = """select student_id, franchises_id, first_name, last_name, 
                                            students.created_date, students.status from students
                                            WHERE franchises_id=%s AND s.counsilor_id is Null"""
                value = (franchiseId, status)
            elif (status == "Assigned"):
                sqlGetStudents = """select student_id, franchises_id, first_name, last_name, 
                                    students.created_date, students.status from students
                                    WHERE franchises_id=%s and students.status=%s"""
                value = (franchiseId, "Lead")
            elif (status == "All"):
                sqlGetStudents = """select student_id, franchises_id, first_name, last_name, 
                                                   students.created_date, students.status from students
                                                   WHERE franchises_id=%s"""
                value = (franchiseId,)
            else:
                sqlGetStudents = """select student_id, franchises_id, first_name, last_name, 
                                    students.created_date, students.status from students
                                    WHERE franchises_id=%s and students.status=%s"""
                value = (franchiseId, status)
            cursor.execute(sqlGetStudents, value)
            studentsList = cursor.fetchall()
            if studentsList:
                students = json.dumps(studentsList, default=str)
            else:
                students.append('No data found')
        except mysql.Error as e:
            students.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return students


class getFranchiseStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        franchiseId = data["franchiseId"]
        studentDetails = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectStud = """select student_id, first_name, last_name, students.email, mobile_no, dob, name from students 
                        left outer join users on students.franchises_id=users.franchise_id where students.franchises_id=%s"""
            value = (franchiseId,)
            cursor.execute(sqlSelectStud, value)
            students_data = cursor.fetchall()
            if students_data:
                studentDetails = json.dumps(students_data, default=str)
            else:
                studentDetails.append('No data found')
        except mysql.Error as e:
            studentDetails.append(str(e))
        finally:
            cursor.close()

        return studentDetails


class getFranchiseWithOfficeId(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data["officeId"]
        franchiseDetails = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetFranchiseDetails = """select franchise_id, company_name, company_website, director_first_name, director_last_name, 
                                    director_email, country_code, director_contact_number, postal_address, city, country, bdm, consultant_assigned, 
                                    contract_done, processing_office from franchise where processing_office=%s order by franchise_id asc"""
            value = (officeId,)
            cursor.execute(sqlGetFranchiseDetails, value)
            franchiseDetail = cursor.fetchall()
            if franchiseDetail:
                franchiseDetails = json.dumps(franchiseDetail, default=str)
            else:
                franchiseDetails.append('No data found')
        except mysql.Error as e:
            franchiseDetails.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseDetails


class franchiseStatusUpdate(Resource):
    def post(self):
        data = request.get_json(force=True)
        studentId = data["studentId"]
        status = data["status"]
        office = data["office"]
        consultant = data["consultant"]
        marketingSource = data["marketingSource"]
        franchise = data["franchise"]
        updated_by = data["updated_by"]

        statusUpdateMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlUpdateStud = """update students set status=%s, office_id=%s, counsilor_id=%s, lead_source=%s, franchises_id=%s, updated_by=%s
                            where student_id=%s"""
            value = (status, office, consultant, marketingSource, franchise, updated_by, studentId,)
            cursor.execute(sqlUpdateStud, value)
            sqlUpdateApplication = """update application set franchise=%s
                                        where student_id=%s"""
            valueApplication = (franchise, studentId,)
            cursor.execute(sqlUpdateApplication, valueApplication)
            statusUpdateMsg.append("Status updated")
        except mysql.Error as e:
            statusUpdateMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return statusUpdateMsg


class getFranchiseYearStudents(Resource):
    def post(self):
        data = request.get_json(force=True)
        selectedYear = data["year"]
        franchiseId = data["franchiseId"]
        status = data["status"]
        status = status.capitalize()
        selectedData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if (status == "Unassigned"):
                sqlSelectStud = """SELECT s.student_id, s.first_name, s.last_name, s.email, s.mobile_no, s.dob, utm_source, sn.note AS last_note, sn.created_date AS last_note_date,s.status FROM students s 
                            LEFT OUTER JOIN (SELECT student_id, MAX(created_date) AS max_note_date FROM notes 
                            GROUP BY student_id) max_notes ON s.student_id = max_notes.student_id
                            LEFT OUTER JOIN notes sn ON s.student_id = sn.student_id AND max_notes.max_note_date = sn.created_date
                            where YEAR(s.created_date) = %s AND franchises_id = %s AND s.counsilor_id is Null"""
                value = (selectedYear, franchiseId)
            elif (status == "Assigned"):
                sqlSelectStud = """SELECT s.student_id, s.first_name, s.last_name, s.email, s.mobile_no, s.dob, utm_source, sn.note AS last_note, sn.created_date AS last_note_date,s.status FROM students s 
                                                LEFT OUTER JOIN (SELECT student_id, MAX(created_date) AS max_note_date FROM notes 
                                                GROUP BY student_id) max_notes ON s.student_id = max_notes.student_id
                                                LEFT OUTER JOIN notes sn ON s.student_id = sn.student_id AND max_notes.max_note_date = sn.created_date
                                                where YEAR(s.created_date) = %s AND franchises_id = %s AND s.status = %s"""
                value = (selectedYear, franchiseId, "Lead")
            elif (status == "All"):
                sqlSelectStud = """SELECT s.student_id, s.first_name, s.last_name, s.email, s.mobile_no, s.dob, utm_source, sn.note AS last_note, sn.created_date AS last_note_date,s.status FROM students s 
                                            LEFT OUTER JOIN (SELECT student_id, MAX(created_date) AS max_note_date FROM notes 
                                            GROUP BY student_id) max_notes ON s.student_id = max_notes.student_id
                                            LEFT OUTER JOIN notes sn ON s.student_id = sn.student_id AND max_notes.max_note_date = sn.created_date
                                            where YEAR(s.created_date) = %s AND franchises_id = %s"""
                value = (selectedYear, franchiseId)
            else:
                sqlSelectStud = """SELECT s.student_id, s.first_name, s.last_name, s.email, s.mobile_no, s.dob, utm_source, sn.note AS last_note, sn.created_date AS last_note_date,s.status FROM students s 
                                            LEFT OUTER JOIN (SELECT student_id, MAX(created_date) AS max_note_date FROM notes 
                                            GROUP BY student_id) max_notes ON s.student_id = max_notes.student_id
                                            LEFT OUTER JOIN notes sn ON s.student_id = sn.student_id AND max_notes.max_note_date = sn.created_date
                                            where YEAR(s.created_date) = %s AND franchises_id = %s AND s.status = %s"""
                value = (selectedYear, franchiseId, status)
            cursor.execute(sqlSelectStud, value)
            students_data = cursor.fetchall()
            if students_data:
                selectedData = json.dumps(students_data, default=str)
            else:
                selectedData.append('No data found')

        except mysql.Error as e:
            selectedData.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return selectedData


class addFranchiseStudentNotes(Resource):
    def post(self):
        data = request.get_json(force=True)
        studentId = data["studentId"]
        franchiseId = data["franchiseId"]
        note = data["note"]
        contactType = data["contactType"]
        reminderDate = data["reminderDate"]
        leadSource = data["leadSource"]
        if (reminderDate == ""):
            status = 0;
        else:
            status = 1
        addNoteMsg = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlAddNote = """insert into notes(student_id, franchise_ids, note, reminder_date, contact_type, lead_source, status)
                            values (%s, %s, %s, %s, %s, %s, %s)"""
            value = (studentId, franchiseId, note, reminderDate, contactType, leadSource, status,)
            cursor.execute(sqlAddNote, value)
            addNoteMsg.append("Sucessfully Added the Notes")
        except mysql.Error as e:
            addNoteMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return addNoteMsg


class getFranchiseStudentNotes(Resource):
    def post(self):
        data = request.get_json(force=True)
        student_id = data["studentId"]
        studentNotes = []

        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectStud = """SELECT name, note, contact_type, lead_source, notes.created_date, notes.status, reminder_date, note_id FROM notes 
                            left outer join users on users.franchise_id=notes.franchise_ids WHERE student_id=%s order by note_id desc"""
            value = (student_id,)
            cursor.execute(sqlSelectStud, value)
            students_data = cursor.fetchall()
            if students_data:
                studentNotes = json.dumps(students_data, default=str)
            else:
                studentNotes.append('No data found')
        except mysql.Error as e:
            studentNotes.append(str(e))
        finally:
            cursor.close()

        return studentNotes


class getFranchiseStaticCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        toDate = datetime.strptime(toDate, '%Y-%m-%d')
        toDate = toDate + timedelta(days=1)
        toDate = toDate.strftime('%Y-%m-%d')
        franchiseId = data["franchiseId"]
        status = data["status"]
        statusIds = status.split(",")
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        staticCountReport = []
        cursor = cnx.cursor()
        try:
            if "All" in statusIds:
                sqlSelectCountReport = """
                                select 
                                count(DISTINCT IF(students.lead_source="Web",students.student_id,NULL)) as enquiry_count,
                                count(DISTINCT IF(students.status="Active",students.student_id,NULL)) as active_count, 
                                count(DISTINCT IF(students.status="Inactive",students.student_id,NULL)) as inactive_count, 
                                count(DISTINCT IF(students.status="Closed",students.student_id,NULL)) as closed_count,
                                count(IF(cas_issued="casIssued",1,NULL)) as cas_count from students
                                left outer join application on students.student_id=application.student_id 
                                where students.created_date BETWEEN %s AND %s
                                AND students.franchises_id = %s
                                """
                query_params = [fromDate, toDate, franchiseId]
            else:
                sqlSelectCountReport = """
                                    select 
                                    count(DISTINCT IF(students.lead_source="Web",students.student_id,NULL)) as enquiry_count,
                                    count(DISTINCT IF(students.status="Active",students.student_id,NULL)) as active_count, 
                                    count(DISTINCT IF(students.status="Inactive",students.student_id,NULL)) as inactive_count, 
                                    count(DISTINCT IF(students.status="Closed",students.student_id,NULL)) as closed_count,
                                    count(IF(cas_issued="casIssued",1,NULL)) as cas_count from students
                                    left outer join application on students.student_id=application.student_id 
                                    where students.created_date BETWEEN %s AND %s
                                    AND students.franchises_id = %s AND students.status IN ({})
                                    """
                statusIdJoinData = ', '.join(['%s'] * len(statusIds))

                sqlSelectCountReport = sqlSelectCountReport.format(statusIdJoinData)

                query_params = [fromDate, toDate, franchiseId] + statusIds

            cursor.execute(sqlSelectCountReport, query_params)
            countReport = cursor.fetchall()

            if countReport:
                staticCountReport = json.dumps(countReport, default=str)
            else:
                staticCountReport.append('No data found')
        except mysql.Error as e:
            staticCountReport.append(str(e))
        finally:
            cursor.close()
        return staticCountReport


class getFranchiseStudentManagerEDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        toDate = datetime.strptime(toDate, '%Y-%m-%d')
        toDate = toDate + timedelta(days=1)
        toDate = toDate.strftime('%Y-%m-%d')
        franchiseId = data["franchiseId"]
        status = data["status"]
        status = status.split(",")
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        studentManagerEDReport = []
        cursor = cnx.cursor()
        try:
            if "All" in status:
                sqlSelectEDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, students.email, mobile_no, 
                                    students.created_date, students.status, students.lead_source, note, utm_source,
                                    utm_medium, utm_campaign FROM students 
                                    LEFT OUTER JOIN notes ON students.student_id = notes.student_id 
                                    LEFT OUTER JOIN franchise ON students.franchises_id = franchise.franchise_id 
                                    WHERE (notes.student_id, notes.created_date) IN (SELECT student_id, MAX(notes.created_date) 
                                    FROM notes GROUP BY student_id) and students.created_date BETWEEN %s AND %s AND students.franchises_id = %s
                                    """

                query_params = [fromDate, toDate, franchiseId]

            elif "All" not in status:
                sqlSelectEDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, students.email, mobile_no, 
                                    students.created_date, students.status, students.lead_source, note FROM students 
                                    LEFT OUTER JOIN notes ON students.student_id = notes.student_id 
                                    LEFT OUTER JOIN franchise ON students.franchises_id = franchise.franchise_id 
                                    WHERE (notes.student_id, notes.created_date) IN (SELECT student_id, MAX(notes.created_date) 
                                    FROM notes GROUP BY student_id) and students.created_date BETWEEN %s AND %s
                                    AND students.status IN ({}) AND students.franchises_id = %s 
                                    """
                statusJoinData = ', '.join(['%s'] * len(status))

                sqlSelectEDReport = sqlSelectEDReport.format(statusJoinData)

                query_params = [fromDate, toDate] + status + [franchiseId]
            cursor.execute(sqlSelectEDReport, query_params)
            edReport = cursor.fetchall()

            if edReport:
                studentManagerEDReport = json.dumps(edReport, default=str)
            else:
                studentManagerEDReport.append('No data found')

        except mysql.Error as e:
            studentManagerEDReport.append(str(e))
        finally:
            cursor.close()
        return studentManagerEDReport


class getFranchiseApplications(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data['franchiseId']
        selectedYear = data['year']

        applicationData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectApp = """select application.student_id, application_id, institution_name, course_name, course_start_date,
                            first_name, last_name, date_of_application_sent from application left outer join students on 
                            students.student_id=application.student_id where YEAR(application.course_start_date)=%s AND franchises_id = %s"""
            value = (selectedYear, franchiseId)

            cursor.execute(sqlSelectApp, value)
            application_data = cursor.fetchall()
            if application_data:
                applicationData = json.dumps(application_data, default=str)
            else:
                applicationData.append('No data found')

        except mysql.Error as e:
            applicationData.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return applicationData


class getFranchiseFinalChoicedApplication(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data['franchiseId']
        selectedYear = data['year']

        finalChoiceApplicationData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectApp = """select application.student_id, application_id, institution_name, course_name, course_start_date,
                            first_name, last_name, date_of_application_sent from application left outer join students on 
                            students.student_id=application.student_id where YEAR(application.course_start_date)=%s AND franchises_id = %s AND final_choiced=1"""
            value = (selectedYear, franchiseId)

            cursor.execute(sqlSelectApp, value)
            finalchoiced_application_data = cursor.fetchall()
            if finalchoiced_application_data:
                finalChoiceApplicationData = json.dumps(finalchoiced_application_data, default=str)
            else:
                finalChoiceApplicationData.append('No data found')

        except mysql.Error as e:
            finalChoiceApplicationData.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return finalChoiceApplicationData


class getApplicationsFranchiseASDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        franchiseReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, course_name, first_name, last_name, office_name, 
                                    name, date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                    students.email, lead_source, utm_source FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON offices.office_id = students.office_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND franchises_id=%s"""
                query_params = [fromDate, toDate, franchiseId, ]
            else:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, course_name, first_name, last_name, office_name, 
                                    name, date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                    students.email, lead_source, utm_source FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON offices.office_id = students.office_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND franchises_id=%s
                                    AND students.office_id IN ({})"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, franchiseId] + officeIds
            cursor.execute(sqlSelectASDReport, query_params)
            franchiseReport_data = cursor.fetchall()
            if franchiseReport_data:
                franchiseReport = json.dumps(franchiseReport_data, default=str)
            else:
                franchiseReport.append('No data found')
        except mysql.Error as e:
            franchiseReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseReport


class getApplicationsFranchiseCSDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        franchiseReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, course_name, first_name, last_name, office_name, 
                                    name, date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                    students.email, lead_source, utm_source FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON offices.office_id = students.office_id
                                    WHERE course_start_date BETWEEN %s AND %s AND franchises_id=%s"""
                query_params = [fromDate, toDate, franchiseId, ]
            else:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, course_name, first_name, last_name, office_name, 
                                    name, date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                    students.email, lead_source, utm_source FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON offices.office_id = students.office_id
                                    WHERE course_start_date BETWEEN %s AND %s AND franchises_id=%s
                                    AND students.office_id IN ({})"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, franchiseId] + officeIds
            cursor.execute(sqlSelectCSDReport, query_params)
            franchiseReport_data = cursor.fetchall()
            if franchiseReport_data:
                franchiseReport = json.dumps(franchiseReport_data, default=str)
            else:
                franchiseReport.append('No data found')
        except mysql.Error as e:
            franchiseReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseReport


class getApplicationsFranchiseYearCountASDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        franchiseReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectASDReport = """
                                    SELECT year(course_start_date) as year, COUNT(application_id) AS application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                    SUM(CASE WHEN offer_decision_type Is Null THEN 1 ELSE 0 END) AS pending_application_count FROM application 
                                    left outer join students on application.student_id=students.student_id 
                                    where application.date_of_application_sent BETWEEN %s AND %s AND students.franchises_id=%s
                                    group by year(course_start_date) order by year(course_start_date) desc"""
                query_params = [fromDate, toDate, franchiseId, ]
            else:
                sqlSelectASDReport = """
                                    SELECT year(course_start_date) as year, COUNT(application_id) AS application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                    SUM(CASE WHEN offer_decision_type Is Null THEN 1 ELSE 0 END) AS pending_application_count FROM application  
                                    left outer join students on application.student_id=students.student_id 
                                    where application.date_of_application_sent BETWEEN %s AND %s AND students.office_id IN ({}) AND students.franchises_id=%s
                                    group by year(course_start_date) order by year(course_start_date) desc"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, franchiseId] + officeIds
            cursor.execute(sqlSelectASDReport, query_params)
            franchiseReport_data = cursor.fetchall()
            if franchiseReport_data:
                franchiseReport = json.dumps(franchiseReport_data, default=str)
            else:
                franchiseReport.append('No data found')
        except mysql.Error as e:
            franchiseReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseReport


class getApplicationsFranchiseYearCountCSDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        franchiseReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectCSDReport = """
                                    SELECT year(course_start_date) as year, COUNT(application_id) AS application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                    SUM(CASE WHEN offer_decision_type Is Null THEN 1 ELSE 0 END) AS pending_application_count FROM application 
					                left outer join students on students.student_id=application.student_id
                                    where application.course_start_date BETWEEN %s AND %s AND students.franchises_id=%s
                                    group by year(course_start_date) order by year(course_start_date) desc"""
                query_params = [fromDate, toDate, franchiseId, ]
            else:
                sqlSelectCSDReport = """
                                    SELECT year(course_start_date) as year, COUNT(application_id) AS application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                    SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                    SUM(CASE WHEN offer_decision_type Is Null THEN 1 ELSE 0 END) AS pending_application_count FROM application  
                                    left outer join students on application.student_id=students.student_id 
                                    where application.course_start_date BETWEEN %s AND %s AND students.office_id IN ({}) AND students.franchises_id=%s
                                    group by year(course_start_date) order by year(course_start_date) desc"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, franchiseId] + officeIds
            cursor.execute(sqlSelectCSDReport, query_params)
            franchiseReport_data = cursor.fetchall()
            if franchiseReport_data:
                franchiseReport = json.dumps(franchiseReport_data, default=str)
            else:
                franchiseReport.append('No data found')
        except mysql.Error as e:
            franchiseReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseReport


class getYearlyFranchiseProfilePerformance(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        current_year = data["year"]
        previous_year = int(current_year) - 1

        franchiseReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectFranchisePerformance = """
                        SELECT  
                        franchise.franchise_id,
                        franchise.director_first_name,
                        franchise.director_last_name,
                        COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END) AS current_year_application_count, 
                        COUNT(DISTINCT CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END) AS current_year_applicants_count,
                        SUM(CASE WHEN YEAR(application.created_date) = %s AND final_choiced = 1 THEN 1 ELSE 0 END) AS current_year_final_choice_count,
                        COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END) AS previous_year_application_count,
                        COUNT(DISTINCT CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END) AS previous_year_applicants_count,
                        SUM(CASE WHEN YEAR(application.created_date) = %s AND final_choiced = 1 THEN 1 ELSE 0 END) AS previous_year_final_choice_count,
                       IF(
                            COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END) >= COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END),
                            ((COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END) - COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END)) / NULLIF(COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END), 0)) * 100,
                            -(((COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END) - COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END)) / NULLIF(COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END), 0)) * 100)
                        ) AS application_count_difference_percentage,
                        IF(
                            COUNT(CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END) >= COUNT(CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END),
                            ((COUNT(DISTINCT CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END) - COUNT(DISTINCT CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END)) / NULLIF(COUNT(DISTINCT CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END), 0)) * 100,
                            -(((COUNT(DISTINCT CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END) - COUNT(DISTINCT CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END)) / NULLIF(COUNT(DISTINCT CASE WHEN YEAR(students.created_date) = %s THEN application.student_id END), 0)) * 100)
                        ) AS student_count_difference_percentage,
                        IF(
                            COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END) >= COUNT(CASE WHEN YEAR(application.created_date) = %s THEN application_id END),
                            ((SUM(CASE WHEN YEAR(application.created_date) = %s AND final_choiced = 1 THEN 1 ELSE 0 END) - SUM(CASE WHEN YEAR(application.created_date) = %s THEN application_id END)) / NULLIF(SUM(CASE WHEN YEAR(application.created_date) = %s AND final_choiced = 1 THEN 1 ELSE 0 END), 0)) * 100,
                            -(((SUM(CASE WHEN YEAR(application.created_date) = %s AND final_choiced = 1 THEN 1 ELSE 0 END) - SUM(CASE WHEN YEAR(application.created_date) = %s THEN application_id END)) / NULLIF(SUM(CASE WHEN YEAR(application.created_date) = %s AND final_choiced = 1 THEN 1 ELSE 0 END), 0)) * 100)
                        ) AS final_choice_count_difference_percentage
                        FROM 
                            application 
                        LEFT OUTER JOIN 
                            students ON application.student_id = students.student_id 
                        LEFT OUTER JOIN 
                            franchise ON franchise.franchise_id = students.franchises_id 
                        WHERE 
                            franchise.franchise_id = %s
                            AND students.franchises_id IS NOT NULL 
                        GROUP BY 
                            franchise.franchise_id
                                    """

            query_params = [current_year, current_year, current_year, previous_year, previous_year, previous_year,
                            current_year, previous_year, current_year, previous_year, previous_year, previous_year,
                            current_year, previous_year, current_year, previous_year, current_year, previous_year,
                            previous_year, previous_year, current_year, previous_year, current_year, previous_year,
                            current_year, previous_year, previous_year, previous_year, current_year, previous_year,
                            franchiseId]
            cursor.execute(sqlSelectFranchisePerformance, query_params)
            franchiseReport_data = cursor.fetchall()
            if franchiseReport_data:
                franchiseReport = json.dumps(franchiseReport_data, default=str)
            else:
                franchiseReport.append('No data found')
        except mysql.Error as e:
            franchiseReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseReport


class getFinalChoicesFranchiseASDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        franchiseReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectASDReport = """SELECT students.student_id AS student_id, first_name, last_name, students.email, 
                                    nationality, office_name, application.course_type, course_name, name, course_start_date, 
                                    tution_fee, franchise.commission_rate, utm_source, utm_medium, utm_campaign, lead_source,
                                    invoiceNo, invoiceSent, paidToUs, application_id FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON students.office_id = offices.office_id
                                    LEFT OUTER JOIN franchise ON students.franchises_id = franchise.franchise_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND students.franchises_id=%s AND final_choiced=1"""
                query_params = [fromDate, toDate, franchiseId, ]
            else:
                sqlSelectASDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, students.email, 
                                    nationality, office_name, application.course_type, course_name, name, course_start_date, 
                                    tution_fee, commission_rate, utm_source, utm_medium, utm_campaign, lead_source,
                                    invoiceNo, invoiceSent, paidToUs, application_id FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON students.office_id = offices.office_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND franchises_id=%s
                                    AND students.office_id IN ({}) AND final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, franchiseId] + officeIds
            cursor.execute(sqlSelectASDReport, query_params)
            franchiseReport_data = cursor.fetchall()
            if franchiseReport_data:
                franchiseReport = json.dumps(franchiseReport_data, default=str)
            else:
                franchiseReport.append('No data found')
        except mysql.Error as e:
            franchiseReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseReport


class getFinalChoicessFranchiseCSDReport(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        franchiseReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectCSDReport = """SELECT students.student_id AS student_id, first_name, last_name, students.email, 
                                    nationality, office_name, application.course_type, course_name, name, course_start_date, 
                                    tution_fee, franchise.commission_rate, utm_source, utm_medium, utm_campaign, lead_source,
                                    invoiceNo, invoiceSent, paidToUs, application_id FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON students.office_id = offices.office_id
                                    LEFT OUTER JOIN franchise ON students.franchises_id = franchise.franchise_id
                                    WHERE course_start_date BETWEEN %s AND %s AND students.franchises_id=%s AND final_choiced=1"""
                query_params = [fromDate, toDate, franchiseId, ]
            else:
                sqlSelectCSDReport = """
                                    SELECT students.student_id AS student_id, first_name, last_name, students.email, 
                                    nationality, office_name, application.course_type, course_name, name, course_start_date, 
                                    tution_fee, commission_rate, utm_source, utm_medium, utm_campaign, lead_source,
                                    invoiceNo, invoiceSent, paidToUs, application_id FROM application
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                    LEFT OUTER JOIN users ON users.user_id = students.counsilor_id 
                                    LEFT OUTER JOIN offices ON students.office_id = offices.office_id
                                    WHERE course_start_date BETWEEN %s AND %s AND franchises_id=%s
                                    AND students.office_id IN ({}) AND final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, franchiseId] + officeIds
            cursor.execute(sqlSelectCSDReport, query_params)
            franchiseReport_data = cursor.fetchall()
            if franchiseReport_data:
                franchiseReport = json.dumps(franchiseReport_data, default=str)
            else:
                franchiseReport.append('No data found')
        except mysql.Error as e:
            franchiseReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseReport


class franchiseContractFileUpload(Resource):
    def post(self):
        file = request.files["file"]
        franchiseId = request.form["franchiseId"]
        filename = secure_filename(file.filename)
        uploadFile = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            file.save(os.path.join(CONTRACT_FOLDER, filename))
            uploadFile.append('File uploaded Successfully\n')
            try:
                sqlAddContractFile = """insert into franchise_contract (franchise_contract_file, franchise_id) values (%s, %s)"""
                value = (filename, franchiseId,)
                cursor.execute(sqlAddContractFile, value)
                last_insert_id = cursor.lastrowid
                uploadFile.append('File Added')
                uploadFile.append(last_insert_id)
            except mysql.Error as e:
                uploadFile.append(str(e))
            finally:
                cnx.commit()
                cursor.close()
        except OSError as e:
            uploadFile.append(str(e))

        return uploadFile


class getFranchiseContractFile(Resource):
    def post(self):
        data = request.get_json(force=True)
        fileName = data["fileName"]
        fileType = ""
        try:
            base64_files = []  # Initialize a list to store the Base64-encoded images
            file_path = os.path.join(CONTRACT_FOLDER, fileName)

            # Check if the file exists
            image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tif', '.tiff'}
            if os.path.exists(file_path) and os.path.splitext(file_path)[1].lower() in image_extensions:
                with open(file_path, 'rb') as image_file:
                    image_contents = image_file.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_image = base64.b64encode(image_contents).decode('utf-8')
                    base64_files.append(base64_image)
                fileType = "image"
            elif os.path.exists(file_path) and os.path.splitext(file_path)[1].lower() == '.pdf':
                # Open and read the file
                with open(file_path, 'rb') as file_to_read:
                    file_contents = file_to_read.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_pdf = base64.b64encode(file_contents).decode('utf-8')
                    base64_files.append(base64_pdf)
                fileType = "pdf"
            elif os.path.exists(file_path) and (os.path.splitext(file_path)[1].lower() == '.xlsx'
                                                or os.path.splitext(file_path)[1].lower() == '.xls'):
                # Open and read the Excel file
                with open(file_path, 'rb') as excel_file:
                    excel_contents = excel_file.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_excel = base64.b64encode(excel_contents).decode('utf-8')
                    base64_files.append(base64_excel)
                fileType = "xl"
            elif os.path.exists(file_path) and os.path.splitext(file_path)[1].lower() == '.csv':
                # Open and read the CSV file
                with open(file_path, 'rb') as csv_file:
                    csv_contents = csv_file.read()
                    # Encode the binary data as Base64 and add to the list
                    base64_csv = base64.b64encode(csv_contents).decode('utf-8')
                    base64_files.append(base64_csv)
                fileType = "csv"
            else:
                base64_files.append('')
                fileType = ""
        except mysql.Error as e:
            staffDet.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return [base64_files, fileType]


class updateFranchiseContractFiles(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        contractFiles = data["contractFiles"]

        contract = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlUpdateContract = """update franchise set franchise_contract_files=%s where franchise_id=%s"""
            value = (contractFiles, franchiseId,)
            cursor.execute(sqlUpdateContract, value)
            contract.append('Contract Files Updated')
        except mysql.Error as e:
            contract.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return contract


class getFranchiseContractFileList(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        franchiseContract = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetFranchiseContractFile = """select franchise_id, franchise_contract_files from franchise where franchise_id= %s order by franchise_id asc"""
            value = (franchiseId,)
            cursor.execute(sqlGetFranchiseContractFile, value)
            franchiseContract = cursor.fetchall()
            if franchiseContract:
                franchiseContract = json.dumps(franchiseContract, default=str)
            else:
                franchiseContract.append('No data found')
        except mysql.Error as e:
            franchiseContract.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseContract


class getFranchiseNotes(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        franchiseNotes = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetFranchiseNotes = """select name, franchise_note, franchise_note.created_date, franchise_note.franchise_note_id from franchise_note 
                                    left outer join users on users.user_id=franchise_note.staff_id 
                                    where franchise_note.franchise_id=%s and status=0 order by franchise_note_id desc"""
            value = (franchiseId,)
            cursor.execute(sqlGetFranchiseNotes, value)
            franchiseNotes = cursor.fetchall()
            if franchiseNotes:
                franchiseNotes = json.dumps(franchiseNotes, default=str)
            else:
                franchiseNotes.append('No data found')
        except mysql.Error as e:
            franchiseNotes.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseNotes


class addFranchiseNotes(Resource):
    def post(self):
        data = request.get_json(force=True)
        staffId = data["staffId"]
        franchiseId = data["franchiseId"]
        note = data["note"]
        noteAdd = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlAddFranchiseNote = """insert into franchise_note (staff_id,franchise_id, franchise_note) values (%s,%s,%s)"""
            value = (staffId, franchiseId, note,)
            cursor.execute(sqlAddFranchiseNote, value)
            noteAdd.append('Franchise note Added')
        except mysql.Error as e:
            noteAdd.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return noteAdd


class deleteFranchiseNote(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseNoteId = data["franchiseNoteId"]
        franchiseNotes = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetFranchiseNote = """update franchise_note set status=1 where franchise_note_id=%s"""
            value = (franchiseNoteId,)
            cursor.execute(sqlGetFranchiseNote, value)
            franchiseNotes.append('Note delete')
        except mysql.Error as e:
            franchiseNotes.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseNotes


class updateFranchise(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        companyName = data["companyName"]
        companyWebsite = data["companyWebsite"]
        directorFirstName = data["directorFirstName"]
        directorLastName = data["directorLastName"]
        directorEmail = data["directorEmail"]
        countryCode = data["countryCode"]
        directorContactNumber = data["directorContactNumber"]
        postalAddress = data["postalAddress"]
        city = data["city"]
        country = data["country"]
        bdm = data["bdm"]
        consultantAssigned = data["consultantAssigned"]
        contractDone = data["contractDone"]
        processingOffice = data["processingOffice"]
        commissionRate = data["commissionRate"]

        updateFranchiseMsg = []

        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlFranchiseUpdate = """update franchise set company_name=%s, company_website=%s, director_first_name=%s, director_last_name=%s, 
                            director_email=%s, country_code=%s, director_contact_number=%s, postal_address=%s, city=%s, country=%s, 
                            bdm=%s, consultant_assigned=%s, contract_done=%s, processing_office=%s, commission_rate=%s where franchise_id=%s"""
            valFranchiseUpdate = (
            companyName, companyWebsite, directorFirstName, directorLastName, directorEmail, countryCode,
            directorContactNumber,
            postalAddress, city, country, bdm, consultantAssigned, contractDone, processingOffice, commissionRate,
            franchiseId,)
            cursor.execute(sqlFranchiseUpdate, valFranchiseUpdate)
            updateFranchiseMsg.append("Sucessfully Updated the Franchise")

        except mysql.Error as e:
            updateFranchiseMsg.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return updateFranchiseMsg


class getFinalChoicesFranchiseCourseTypeASDCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        franchiseReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectASDReport = """SELECT COUNT(*) AS total_count, COUNT(CASE WHEN course_type = 'Postgraduate' THEN 1 END) AS pg_count, 
                                    COUNT(CASE WHEN course_type = 'Undergraduate' THEN 1 END) AS ug_count, 
                                    COUNT(CASE WHEN course_type = 'Pathways Follow on' THEN 1 END) AS pathways_follow_count, 
                                    COUNT(CASE WHEN course_type = 'Year 2 Follow on' THEN 1 END) AS Y2_count, 
                                    COUNT(CASE WHEN course_type = 'Year 3 Follow on' THEN 1 END) AS Y3_count, 
                                    COUNT(CASE WHEN course_type = 'Pre-Sessional' THEN 1 END) AS preSess_count, 
                                    SUM(CASE WHEN course_type IN ('Pre-Masters', 'Foundation', 'Phd', 'Summer School') THEN 1 ELSE 0 END) AS other_count 
                                    FROM application 
                                    left outer join students on application.student_id=students.student_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND students.franchises_id=%s AND final_choiced=1"""
                query_params = [fromDate, toDate, franchiseId, ]
            else:
                sqlSelectASDReport = """
                                    SELECT COUNT(*) AS total_count, COUNT(CASE WHEN course_type = 'Postgraduate' THEN 1 END) AS pg_count, 
                                    COUNT(CASE WHEN course_type = 'Undergraduate' THEN 1 END) AS ug_count, 
                                    COUNT(CASE WHEN course_type = 'Pathways Follow on' THEN 1 END) AS pathways_follow_count, 
                                    COUNT(CASE WHEN course_type = 'Year 2 Follow on' THEN 1 END) AS Y2_count, 
                                    COUNT(CASE WHEN course_type = 'Year 3 Follow on' THEN 1 END) AS Y3_count, 
                                    COUNT(CASE WHEN course_type = 'Pre-Sessional' THEN 1 END) AS preSess_count, 
                                    SUM(CASE WHEN course_type IN ('Pre-Masters', 'Foundation', 'Phd', 'Summer School') THEN 1 ELSE 0 END) AS other_count 
                                    FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND students.franchises_id=%s
                                    AND students.office_id IN ({}) AND final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectASDReport = sqlSelectASDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, franchiseId] + officeIds
            cursor.execute(sqlSelectASDReport, query_params)
            franchiseReport_data = cursor.fetchall()
            if franchiseReport_data:
                franchiseReport = json.dumps(franchiseReport_data, default=str)
            else:
                franchiseReport.append('No data found')
        except mysql.Error as e:
            franchiseReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseReport


class getFinalChoicesFranchiseCourseTypeCSDCount(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        officeId = data["officeId"]
        officeIds = officeId.split(",")

        franchiseReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in officeIds:
                sqlSelectCSDReport = """SELECT COUNT(*) AS total_count, COUNT(CASE WHEN course_type = 'Postgraduate' THEN 1 END) AS pg_count, 
                                    COUNT(CASE WHEN course_type = 'Undergraduate' THEN 1 END) AS ug_count, 
                                    COUNT(CASE WHEN course_type = 'Pathways Follow on' THEN 1 END) AS pathways_follow_count, 
                                    COUNT(CASE WHEN course_type = 'Year 2 Follow on' THEN 1 END) AS Y2_count, 
                                    COUNT(CASE WHEN course_type = 'Year 3 Follow on' THEN 1 END) AS Y3_count, 
                                    COUNT(CASE WHEN course_type = 'Pre-Sessional' THEN 1 END) AS preSess_count, 
                                    SUM(CASE WHEN course_type IN ('Pre-Masters', 'Foundation', 'Phd', 'Summer School') THEN 1 ELSE 0 END) AS other_count 
                                    FROM application 
                                    left outer join students on application.student_id=students.student_id
                                    WHERE course_start_date BETWEEN %s AND %s AND students.franchises_id=%s AND final_choiced=1"""
                query_params = [fromDate, toDate, franchiseId, ]
            else:
                sqlSelectCSDReport = """
                                    SELECT COUNT(*) AS total_count, COUNT(CASE WHEN course_type = 'Postgraduate' THEN 1 END) AS pg_count, 
                                    COUNT(CASE WHEN course_type = 'Undergraduate' THEN 1 END) AS ug_count, 
                                    COUNT(CASE WHEN course_type = 'Pathways Follow on' THEN 1 END) AS pathways_follow_count, 
                                    COUNT(CASE WHEN course_type = 'Year 2 Follow on' THEN 1 END) AS Y2_count, 
                                    COUNT(CASE WHEN course_type = 'Year 3 Follow on' THEN 1 END) AS Y3_count, 
                                    COUNT(CASE WHEN course_type = 'Pre-Sessional' THEN 1 END) AS preSess_count, 
                                    SUM(CASE WHEN course_type IN ('Pre-Masters', 'Foundation', 'Phd', 'Summer School') THEN 1 ELSE 0 END) AS other_count 
                                    FROM application 
                                    LEFT OUTER JOIN students ON students.student_id = application.student_id
                                    WHERE course_start_date BETWEEN %s AND %s AND franchises_id=%s
                                    AND students.office_id IN ({}) AND final_choiced=1"""
                officeIdJoinData = ', '.join(['%s'] * len(officeIds))
                sqlSelectCSDReport = sqlSelectCSDReport.format(officeIdJoinData)

                query_params = [fromDate, toDate, franchiseId] + officeIds
            cursor.execute(sqlSelectCSDReport, query_params)
            franchiseReport_data = cursor.fetchall()
            if franchiseReport_data:
                franchiseReport = json.dumps(franchiseReport_data, default=str)
            else:
                franchiseReport.append('No data found')
        except mysql.Error as e:
            franchiseReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseReport


class getFranchiseReportApplicationsASD(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        franchiseIds = franchiseId.split(",")
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        countryId = data["countryId"]
        countryIds = countryId.split(",")

        franchiseReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in franchiseIds and "All" in countryIds:
                sqlSelectASDReport = """
                                        SELECT students.student_id AS student_id, course_name, first_name, last_name, 
                                        date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                        students.email, lead_source, utm_source,franchise.director_first_name,
                                        franchise.director_last_name,franchise.contract_done,students.study_abroad_destination,franchise.company_name FROM application 
                                        LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                        LEFT OUTER JOIN franchise ON franchise.franchise_id = students.franchises_id 
                                        WHERE date_of_application_sent BETWEEN %s AND %s AND students.franchises_id IS NOT NULL
                                        ORDER BY date_of_application_sent"""
                query_params = [fromDate, toDate, ]
            elif "All" in franchiseIds and "All" not in countryIds:
                sqlSelectASDReport = """
                                        SELECT students.student_id AS student_id, course_name, first_name, last_name, 
                                        date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                        students.email, lead_source, utm_source, franchise.director_first_name,
                                        franchise.director_last_name,franchise.contract_done,students.study_abroad_destination,franchise.company_name FROM application 
                                        LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                        LEFT OUTER JOIN franchise ON franchise.franchise_id = students.franchises_id 
                                        WHERE date_of_application_sent BETWEEN %s AND %s 
                                        AND students.study_abroad_destination IN ({}) AND students.franchises_id IS NOT NULL
                                        ORDER BY date_of_application_sent"""
                countryIdsJoinData = ', '.join(['%s'] * len(countryIds))
                sqlSelectASDReport = sqlSelectASDReport.format(countryIdsJoinData)

                query_params = [fromDate, toDate] + countryIds
            elif "All" not in franchiseIds and "All" in countryIds:
                sqlSelectASDReport = """
                                        SELECT students.student_id AS student_id, course_name, first_name, last_name, 
                                        date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                        students.email, lead_source, utm_source, franchise.director_first_name,
                                        franchise.director_last_name,franchise.contract_done,students.study_abroad_destination,franchise.company_name FROM application 
                                        LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                        LEFT OUTER JOIN franchise ON franchise.franchise_id = students.franchises_id 
                                        WHERE date_of_application_sent BETWEEN %s AND %s 
                                        AND students.franchises_id IN ({}) AND students.franchises_id IS NOT NULL
                                        ORDER BY date_of_application_sent"""
                franchiseIdsJoinData = ', '.join(['%s'] * len(franchiseIds))
                sqlSelectASDReport = sqlSelectASDReport.format(franchiseIdsJoinData)

                query_params = [fromDate, toDate] + franchiseIds

            else:
                sqlSelectASDReport = """
                                        SELECT students.student_id AS student_id, course_name, first_name, last_name, 
                                        date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                        students.email, lead_source, utm_source,franchise.director_first_name,
                                        franchise.director_last_name,franchise.contract_done,students.study_abroad_destination,franchise.company_name FROM application 
                                        LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                        LEFT OUTER JOIN franchise ON franchise.franchise_id = students.franchises_id 
                                        WHERE date_of_application_sent BETWEEN %s AND %s 
                                        AND students.franchises_id IN ({}) AND students.study_abroad_destination IN ({}) AND students.franchises_id IS NOT NULL
                                        ORDER BY date_of_application_sent"""

                franchiseIdsJoinData = ', '.join(['%s'] * len(franchiseIds))
                countryIdsJoinData = ', '.join(['%s'] * len(countryIds))
                sqlSelectASDReport = sqlSelectASDReport.format(franchiseIdsJoinData, countryIdsJoinData)

                query_params = [fromDate, toDate] + franchiseIds + countryIds

            cursor.execute(sqlSelectASDReport, query_params)
            franchiseReport_data = cursor.fetchall()
            if franchiseReport_data:
                franchiseReport = json.dumps(franchiseReport_data, default=str)
            else:
                franchiseReport.append('No data found')
        except mysql.Error as e:
            franchiseReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseReport


class getFranchiseReportApplicationsCSD(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        franchiseIds = franchiseId.split(",")
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        countryId = data["countryId"]
        countryIds = countryId.split(",")

        franchiseReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in franchiseIds and "All" in countryIds:
                sqlSelectASDReport = """
                                        SELECT students.student_id AS student_id, course_name, first_name, last_name, 
                                        date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                        students.email, lead_source, utm_source, franchise.director_first_name,
                                        franchise.director_last_name,franchise.contract_done,students.study_abroad_destination,franchise.company_name FROM application 
                                        LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                        LEFT OUTER JOIN franchise ON franchise.franchise_id = students.franchises_id 
                                        WHERE course_start_date BETWEEN %s AND %s AND students.franchises_id IS NOT NULL
                                        ORDER BY course_start_date"""
                query_params = [fromDate, toDate, ]
            elif "All" in franchiseIds and "All" not in countryIds:
                sqlSelectASDReport = """
                                        SELECT students.student_id AS student_id, course_name, first_name, last_name,
                                        date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                        students.email, lead_source, utm_source, franchise.director_first_name,
                                        franchise.director_last_name,franchise.contract_done,students.study_abroad_destination,franchise.company_name FROM application 
                                        LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                        LEFT OUTER JOIN franchise ON franchise.franchise_id = students.franchises_id 
                                        WHERE course_start_date BETWEEN %s AND %s 
                                        AND students.study_abroad_destination IN ({}) AND students.franchises_id IS NOT NULL
                                        ORDER BY course_start_date"""
                countryIdsJoinData = ', '.join(['%s'] * len(countryIds))
                sqlSelectASDReport = sqlSelectASDReport.format(countryIdsJoinData)

                query_params = [fromDate, toDate] + countryIds
            elif "All" not in franchiseIds and "All" in countryIds:
                sqlSelectASDReport = """
                                        SELECT students.student_id AS student_id, course_name, first_name, last_name,
                                        date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                        students.email, lead_source, utm_source, franchise.director_first_name,
                                        franchise.director_last_name,franchise.contract_done,students.study_abroad_destination,franchise.company_name FROM application 
                                        LEFT OUTER JOIN students ON students.student_id = application.student_id 
                                        LEFT OUTER JOIN franchise ON franchise.franchise_id = students.franchises_id 
                                        WHERE course_start_date BETWEEN %s AND %s 
                                        AND students.franchises_id IN ({}) AND students.franchises_id IS NOT NULL
                                        ORDER BY course_start_date"""
                franchiseIdsJoinData = ', '.join(['%s'] * len(franchiseIds))
                sqlSelectASDReport = sqlSelectASDReport.format(franchiseIdsJoinData)

                query_params = [fromDate, toDate] + franchiseIds

            else:
                sqlSelectASDReport = """
                                        SELECT students.student_id AS student_id, course_name, first_name, last_name,
                                        date_of_application_sent, course_start_date, offer_decision_type, nationality, mobile_no,
                                        students.email, lead_source, utm_source, franchise.director_first_name,
                                        franchise.director_last_name,franchise.contract_done,students.study_abroad_destination,franchise.company_name FROM application 
                                        LEFT OUTER JOIN students ON students.student_id = application.student_id
                                        LEFT OUTER JOIN franchise ON franchise.franchise_id = students.franchises_id  
                                        WHERE course_start_date BETWEEN %s AND %s 
                                        AND students.franchises_id IN ({}) AND students.study_abroad_destination IN ({}) AND students.franchises_id IS NOT NULL
                                        ORDER BY course_start_date"""

                franchiseIdsJoinData = ', '.join(['%s'] * len(franchiseIds))
                countryIdsJoinData = ', '.join(['%s'] * len(countryIds))
                sqlSelectASDReport = sqlSelectASDReport.format(franchiseIdsJoinData, countryIdsJoinData)

                query_params = [fromDate, toDate] + franchiseIds + countryIds

            cursor.execute(sqlSelectASDReport, query_params)
            franchiseReport_data = cursor.fetchall()
            if franchiseReport_data:
                franchiseReport = json.dumps(franchiseReport_data, default=str)
            else:
                franchiseReport.append('No data found')
        except mysql.Error as e:
            franchiseReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseReport


class getFranchiseReportApplicationCountASD(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        franchiseIds = franchiseId.split(",")
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        countryId = data["countryId"]
        countryIds = countryId.split(",")

        franchiseReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in franchiseIds and "All" in countryIds:
                sqlSelectASDReport = """
                                    SELECT  
                                        COUNT(application_id) AS application_count, 
                                        SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                        SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                        SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                        SUM(CASE WHEN offer_decision_type IS NULL THEN 1 ELSE 0 END) AS pending_application_count,
                                        franchise.franchise_id,
                                        franchise.director_first_name,
                                        franchise.director_last_name,
                                        SUM(CASE WHEN offer_decision_type = 'Withdrawn' THEN 1 ELSE 0 END) AS withdrawn_application_count,
                                        SUM(CASE WHEN offer_decision_type = 'Course Full' THEN 1 ELSE 0 END) AS coursefull_application_count,
                                        COUNT(DISTINCT application.student_id) AS applicants_count,
                                        SUM(CASE WHEN final_choiced = 1 THEN 1 ELSE 0 END) AS final_choice_count,
                                        franchise.company_name
                                    FROM 
                                        application 
                                    LEFT OUTER JOIN 
                                        students ON application.student_id = students.student_id 
                                    LEFT OUTER JOIN 
                                        franchise ON franchise.franchise_id = students.franchises_id 
                                    WHERE date_of_application_sent BETWEEN %s AND %s AND students.franchises_id IS NOT NULL
                                    GROUP BY 
                                        franchise.franchise_id
                                    """

                query_params = [fromDate, toDate]
            elif "All" in franchiseIds and "All" not in countryIds:
                sqlSelectASDReport = """
                                       SELECT  
                                           COUNT(application_id) AS application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                           SUM(CASE WHEN offer_decision_type IS NULL THEN 1 ELSE 0 END) AS pending_application_count,
                                           franchise.franchise_id,
                                           franchise.director_first_name,
                                           franchise.director_last_name,
                                           SUM(CASE WHEN offer_decision_type = 'Withdrawn' THEN 1 ELSE 0 END) AS withdrawn_application_count,
                                           SUM(CASE WHEN offer_decision_type = 'Course Full' THEN 1 ELSE 0 END) AS coursefull_application_count,
                                           COUNT(DISTINCT application.student_id) AS applicants_count,
                                           franchise.company_name
                                       FROM 
                                           application 
                                       LEFT OUTER JOIN 
                                           students ON application.student_id = students.student_id
                                       LEFT OUTER JOIN 
                                            franchise ON franchise.franchise_id = students.franchises_id  
                                       WHERE date_of_application_sent BETWEEN %s AND %s AND students.study_abroad_destination IN ({}) AND students.franchises_id IS NOT NULL
                                       GROUP BY 
                                           franchise.franchise_id
                                       """
                countryIdsJoinData = ', '.join(['%s'] * len(countryIds))
                sqlSelectASDReport = sqlSelectASDReport.format(countryIdsJoinData)

                query_params = [fromDate, toDate] + countryIds
            elif "All" not in franchiseIds and "All" in countryIds:
                sqlSelectASDReport = """
                                       SELECT  
                                           COUNT(application_id) AS application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                           SUM(CASE WHEN offer_decision_type IS NULL THEN 1 ELSE 0 END) AS pending_application_count,
                                           franchise.franchise_id,
                                           franchise.director_first_name,
                                           franchise.director_last_name,
                                           SUM(CASE WHEN offer_decision_type = 'Withdrawn' THEN 1 ELSE 0 END) AS withdrawn_application_count,
                                           SUM(CASE WHEN offer_decision_type = 'Course Full' THEN 1 ELSE 0 END) AS coursefull_application_count,
                                           COUNT(DISTINCT application.student_id) AS applicants_count,
                                           SUM(CASE WHEN final_choiced = 1 THEN 1 ELSE 0 END) AS final_choice_count,
                                           franchise.company_name
                                       FROM 
                                           application 
                                       LEFT OUTER JOIN 
                                           students ON application.student_id = students.student_id 
                                       LEFT OUTER JOIN 
                                           franchise ON franchise.franchise_id = students.franchises_id  
                                       WHERE date_of_application_sent BETWEEN %s AND %s AND students.franchises_id IN ({}) AND students.franchises_id IS NOT NULL
                                       GROUP BY 
                                           franchise.franchise_id
                                       """
                franchiseIdsJoinData = ', '.join(['%s'] * len(franchiseIds))
                sqlSelectASDReport = sqlSelectASDReport.format(franchiseIdsJoinData)

                query_params = [fromDate, toDate] + franchiseIds
            else:
                sqlSelectASDReport = """
                                       SELECT  
                                           COUNT(application_id) AS application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                           SUM(CASE WHEN offer_decision_type IS NULL THEN 1 ELSE 0 END) AS pending_application_count,
                                           franchise.franchise_id,
                                           franchise.director_first_name,
                                           franchise.director_last_name,
                                           SUM(CASE WHEN offer_decision_type = 'Withdrawn' THEN 1 ELSE 0 END) AS withdrawn_application_count,
                                           SUM(CASE WHEN offer_decision_type = 'Course Full' THEN 1 ELSE 0 END) AS coursefull_application_count,
                                           COUNT(DISTINCT application.student_id) AS applicants_count,
                                           SUM(CASE WHEN final_choiced = 1 THEN 1 ELSE 0 END) AS final_choice_count,
                                           franchise.company_name
                                       FROM 
                                           application 
                                       LEFT OUTER JOIN 
                                           students ON application.student_id = students.student_id
                                       LEFT OUTER JOIN 
                                           franchise ON franchise.franchise_id = students.franchises_id   
                                       WHERE date_of_application_sent BETWEEN %s AND %s AND students.partner_id IN ({}) AND students.study_abroad_destination IN ({}) AND students.franchises_id IS NOT NULL
                                       GROUP BY 
                                           franchise.franchise_id
                                       """
                franchiseIdsJoinData = ', '.join(['%s'] * len(franchiseIds))
                countryIdsJoinData = ', '.join(['%s'] * len(countryIds))
                sqlSelectASDReport = sqlSelectASDReport.format(franchiseIdsJoinData, countryIdsJoinData)

                query_params = [fromDate, toDate] + franchiseIds + countryIds

            cursor.execute(sqlSelectASDReport, query_params)
            franchiseReport_data = cursor.fetchall()
            if franchiseReport_data:
                franchiseReport = json.dumps(franchiseReport_data, default=str)
            else:
                franchiseReport.append('No data found')
        except mysql.Error as e:
            franchiseReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseReport


class getFranchiseReportApplicationCountCSD(Resource):
    def post(self):
        data = request.get_json(force=True)
        franchiseId = data["franchiseId"]
        franchiseIds = franchiseId.split(",")
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        countryId = data["countryId"]
        countryIds = countryId.split(",")

        franchiseReport = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            if "All" in franchiseIds and "All" in countryIds:
                sqlSelectASDReport = """
                                    SELECT  
                                        COUNT(application_id) AS application_count, 
                                        SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                        SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                        SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                        SUM(CASE WHEN offer_decision_type IS NULL THEN 1 ELSE 0 END) AS pending_application_count,
                                        franchise.franchise_id,
                                        franchise.director_first_name,
                                        franchise.director_last_name,
                                        SUM(CASE WHEN offer_decision_type = 'Withdrawn' THEN 1 ELSE 0 END) AS withdrawn_application_count,
                                        SUM(CASE WHEN offer_decision_type = 'Course Full' THEN 1 ELSE 0 END) AS coursefull_application_count,
                                        COUNT(DISTINCT application.student_id) AS applicants_count,
                                        SUM(CASE WHEN final_choiced = 1 THEN 1 ELSE 0 END) AS final_choice_count,
                                        franchise.company_name
                                    FROM 
                                        application 
                                    LEFT OUTER JOIN 
                                        students ON application.student_id = students.student_id 
                                    LEFT OUTER JOIN 
                                           franchise ON franchise.franchise_id = students.franchises_id  
                                    WHERE course_start_date BETWEEN %s AND %s AND students.franchises_id IS NOT NULL
                                    GROUP BY 
                                        franchise.franchise_id
                                    """

                query_params = [fromDate, toDate]
            elif "All" in franchiseIds and "All" not in countryIds:
                sqlSelectASDReport = """
                                       SELECT  
                                           COUNT(application_id) AS application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                           SUM(CASE WHEN offer_decision_type IS NULL THEN 1 ELSE 0 END) AS pending_application_count,
                                           franchise.franchise_id,
                                           franchise.director_first_name,
                                           franchise.director_last_name,
                                           SUM(CASE WHEN offer_decision_type = 'Withdrawn' THEN 1 ELSE 0 END) AS withdrawn_application_count,
                                           SUM(CASE WHEN offer_decision_type = 'Course Full' THEN 1 ELSE 0 END) AS coursefull_application_count,
                                           COUNT(DISTINCT application.student_id) AS applicants_count,
                                           SUM(CASE WHEN final_choiced = 1 THEN 1 ELSE 0 END) AS final_choice_count,
                                           franchise.company_name
                                       FROM 
                                           application 
                                       LEFT OUTER JOIN 
                                           students ON application.student_id = students.student_id 
                                       LEFT OUTER JOIN 
                                           franchise ON franchise.franchise_id = students.franchises_id  
                                       WHERE course_start_date BETWEEN %s AND %s AND students.study_abroad_destination IN ({}) AND students.franchises_id IS NOT NULL
                                       GROUP BY 
                                           franchise.franchise_id
                                       """
                countryIdsJoinData = ', '.join(['%s'] * len(countryIds))
                sqlSelectASDReport = sqlSelectASDReport.format(countryIdsJoinData)

                query_params = [fromDate, toDate] + countryIds
            elif "All" not in franchiseIds and "All" in countryIds:
                sqlSelectASDReport = """
                                       SELECT  
                                           COUNT(application_id) AS application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                           SUM(CASE WHEN offer_decision_type IS NULL THEN 1 ELSE 0 END) AS pending_application_count,
                                           franchise.franchise_id,
                                           franchise.director_first_name,
                                           franchise.director_last_name,
                                           SUM(CASE WHEN offer_decision_type = 'Withdrawn' THEN 1 ELSE 0 END) AS withdrawn_application_count,
                                           SUM(CASE WHEN offer_decision_type = 'Course Full' THEN 1 ELSE 0 END) AS coursefull_application_count,
                                           COUNT(DISTINCT application.student_id) AS applicants_count,
                                           SUM(CASE WHEN final_choiced = 1 THEN 1 ELSE 0 END) AS final_choice_count,
                                           franchise.company_name
                                       FROM 
                                           application 
                                       LEFT OUTER JOIN 
                                           students ON application.student_id = students.student_id 
                                       LEFT OUTER JOIN 
                                           franchise ON franchise.franchise_id = students.franchises_id 
                                       WHERE course_start_date BETWEEN %s AND %s AND students.franchises_id IN ({}) AND students.franchises_id IS NOT NULL
                                       GROUP BY 
                                           franchise.franchise_id
                                       """
                franchiseIdsJoinData = ', '.join(['%s'] * len(franchiseIds))
                sqlSelectASDReport = sqlSelectASDReport.format(franchiseIdsJoinData)

                query_params = [fromDate, toDate] + franchiseIds
            else:
                sqlSelectASDReport = """
                                       SELECT  
                                           COUNT(application_id) AS application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Unconditional' THEN 1 ELSE 0 END) AS unconditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Conditional' THEN 1 ELSE 0 END) AS conditional_application_count, 
                                           SUM(CASE WHEN offer_decision_type = 'Rejected' THEN 1 ELSE 0 END) AS rejected_application_count, 
                                           SUM(CASE WHEN offer_decision_type IS NULL THEN 1 ELSE 0 END) AS pending_application_count,
                                           franchise.franchise_id,
                                           franchise.director_first_name,
                                           franchise.director_last_name,
                                           SUM(CASE WHEN offer_decision_type = 'Withdrawn' THEN 1 ELSE 0 END) AS withdrawn_application_count,
                                           SUM(CASE WHEN offer_decision_type = 'Course Full' THEN 1 ELSE 0 END) AS coursefull_application_count,
                                           COUNT(DISTINCT application.student_id) AS applicants_count,
                                           SUM(CASE WHEN final_choiced = 1 THEN 1 ELSE 0 END) AS final_choice_count,
                                           franchise.company_name
                                       FROM 
                                           application 
                                       LEFT OUTER JOIN 
                                           students ON application.student_id = students.student_id 
                                       LEFT OUTER JOIN 
                                           franchise ON franchise.franchise_id = students.franchises_id 
                                       WHERE course_start_date BETWEEN %s AND %s AND students.franchises_id IN ({}) AND students.study_abroad_destination IN ({}) AND students.franchises_id IS NOT NULL
                                       GROUP BY 
                                           franchise.franchise_id
                                       """
                franchiseIdsJoinData = ', '.join(['%s'] * len(franchiseIds))
                countryIdsJoinData = ', '.join(['%s'] * len(countryIds))
                sqlSelectASDReport = sqlSelectASDReport.format(franchiseIdsJoinData, countryIdsJoinData)

                query_params = [fromDate, toDate] + franchiseIds + countryIds

            cursor.execute(sqlSelectASDReport, query_params)
            franchiseReport_data = cursor.fetchall()
            if franchiseReport_data:
                franchiseReport = json.dumps(franchiseReport_data, default=str)
            else:
                franchiseReport.append('No data found')
        except mysql.Error as e:
            franchiseReport.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return franchiseReport


class getSelectedReassignData(Resource):
    def post(self):
        data = request.get_json(force=True)
        officeId = data['officeId']
        officeIds = officeId.split(",")

        userId = data['userId']
        userIds = userId.split(",")

        status = data["status"]
        status = status.split(",")

        selectedYear = data["year"]

        selectedData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlSelectStud = """WITH latest_notes AS 
                            (SELECT student_id, note, created_date, ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY created_date DESC) AS rn 
                            FROM notes) 
                            SELECT s.student_id, s.first_name, s.last_name, s.email, s.mobile_no, s.dob, u.name, o.office_name, 
                            s.utm_source, ln.note AS last_note, ln.created_date AS last_note_date, s.status FROM students s 
                            LEFT JOIN users u ON s.counsilor_id = u.user_id 
                            LEFT JOIN offices o ON s.office_id = o.office_id 
                            LEFT JOIN latest_notes ln ON s.student_id = ln.student_id AND ln.rn = 1 WHERE YEAR(s.created_date) = %s"""
            values = [selectedYear]
            if "All" not in officeIds:
                sqlSelectStud += " AND s.office_id IN ({})".format(', '.join(['%s'] * len(officeIds)))
                values.extend(officeIds)

            if "All" not in userIds:
                sqlSelectStud += " AND s.counsilor_id IN ({})".format(', '.join(['%s'] * len(userIds)))
                values.extend(userIds)

            if "All" not in status:
                sqlSelectStud += " AND s.status IN ({})".format(', '.join(['%s'] * len(status)))
                values.extend(status)

            cursor.execute(sqlSelectStud, values)
            students_data = cursor.fetchall()
            if students_data:
                selectedData = json.dumps(students_data, default=str)
            else:
                selectedData.append('No data found')

        except mysql.Error as e:
            selectedData.append(str(e))
        finally:
            cursor.close()
            cnx.close()

        return selectedData

class getInstitutionReport(Resource):
    def post(self):
        data = request.get_json(force=True)

        # Extract input parameters
        institutionType = data['institutionType'].split(",")
        institutionId = data['institutionName'].split(",")
        territory = data['territory'].split(",")

        # Initialize selected data and SQL components
        selectedData = []
        where_clauses = []
        values = []

        # Connect to the database
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()

        try:
            # Build the SQL query dynamically
            sqlSelectInstitution = """SELECT institution_id, institution_name, institution_type, email, home_page, country, teritory,
                                      commission_rate, bonus, application_method, agent_portal_details, course_type, restriction_notes, 
                                      validFrom, validUntil, invoiceMail, commissionable FROM institution"""

            # Build WHERE clauses based on input parameters
            if "All" not in institutionType:
                where_clauses.append("institution_type IN (%s)" % ','.join(['%s'] * len(institutionType)))
                values.extend(institutionType)

            if "All" not in institutionId:
                where_clauses.append("institution_id IN (%s)" % ','.join(['%s'] * len(institutionId)))
                values.extend(institutionId)

            if "All" not in territory:
                where_clauses.append("teritory IN (%s)" % ','.join(['%s'] * len(territory)))
                values.extend(territory)

            # Add WHERE clauses to the SQL query
            if where_clauses:
                sqlSelectInstitution += " WHERE " + " AND ".join(where_clauses)
            # Append ORDER BY clause
            sqlSelectInstitution += " ORDER BY institution_id DESC"  # Corrected column name

            # Execute the SQL query
            cursor.execute(sqlSelectInstitution, values)
            institution_data = cursor.fetchall()

            # Process fetched data
            if institution_data:
                selectedData = json.dumps(institution_data, default=str)
            else:
                selectedData.append('No data found')

        except mysql.Error as e:
            selectedData.append(str(e))

        finally:
            cursor.close()
            cnx.close()

        return selectedData  # Return JSON or error message as response


def generate_unique_id(insert_id, prefix="UAN"):
    random_number = random.randint(1000, 9999)
    return f"{prefix}{insert_id}{random_number}"

# Individula Referral Insert
class individualReferralInsert(Resource):
    def post(self):
        # data = request.get_json()

        firstname = request.form.get('firstname')
        surname = request.form.get('surname')
        phone = request.form.get('phone')
        email = request.form.get('email')
        termsAccept = request.form.get('termsAccept')

        # Connect to the database
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()

        try:
            insert_query = """
                        INSERT INTO individualReferral (person_firstname, person_surname, person_phone, person_email, terms_accept)
                        VALUES (%s, %s, %s, %s, %s)
                        """
            cursor.execute(insert_query, (firstname, surname, phone, email, termsAccept))
            cnx.commit()
            insert_id = cursor.lastrowid
            
            unique_id = generate_unique_id(insert_id)
            
            # Update the record with the unique ID
            update_query = "UPDATE individualReferral SET person_uniqueId = %s WHERE person_id = %s"
            cursor.execute(update_query, (unique_id, insert_id))

            subject = "Welcome to the UAN Global Referral Program!"
            htmlContent = f"<p>Dear {firstname},</p><br><p>Thank you for registering with UAN Global! We’re thrilled to have you join our " \
                          f"referral program, where your support can help more individuals realize their dreams of studying abroad.</p>" \
                          f"<p>As part of our referral community, you now have a unique referral code that allows you to invite friends, " \
                          f"family, and colleagues to explore opportunities with UAN Global. Each time someone uses your referral code to " \
                          f"join us, you both can enjoy exciting rewards and benefits.</p><br>" \
                          f"<p>Here’s your unique referral code: {unique_id}</p>" \
                          f"<p>Thanks<br>UAN Team</p>"

            sendMail(subject, htmlContent, email)

            adminSubject = "New Referral Submission for UAN Global Referral Program"
            adminHtmlContent = f"<p>Hello Admin,</p><br><p>We are excited to inform you that a new individual referral has been submitted. " \
                               f"Below are the details of the referred individual:</p><p>Name :- {firstname}<br>Surname:- {surname}<br>" \
                               f"Id:- {insert_id}<br>UniqueId:- {unique_id}<br>Mobile :- {phone}<br>Email :- {email}" \
                               f"<p>Thanks<br>UAN Team</p>"
            sendMail(adminSubject, adminHtmlContent, "info@uanglobal.com")

            return jsonify({"success": "Success","message": "Your form has been successfully submitted. A unique code has been sent to your email. Please check your inbox","unique_id": unique_id})
        except mysql.Error as e:
            return jsonify({"error": str(e)})

        finally:
            cnx.commit()
            cursor.close()
            cnx.close()

# Business Referral Insert
class businessReferralInsert(Resource):
    def post(self):
        # data = request.get_json()

        companyname = request.form.get('companyname')
        companyUrl = request.form.get('companyUrl')
        mobile = request.form.get('mobile')
        email = request.form.get('email')
        address = request.form.get('address')
        termsAccept = request.form.get('termsAccept')

        # Connect to the database
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()

        try:
            insert_query = """
                            INSERT INTO business_referral (company_name, company_url, company_phone, company_email, company_address, terms_accept)
                            VALUES (%s, %s, %s, %s, %s, %s)
                            """
            cursor.execute(insert_query, (companyname, companyUrl, mobile, email, address, termsAccept))
            cnx.commit()
            insert_id = cursor.lastrowid
            unique_id = generate_unique_id(insert_id)

            # Update the record with the unique ID
            update_query = "UPDATE business_referral SET company_uniqueId = %s WHERE business_id = %s"
            cursor.execute(update_query, (unique_id, insert_id))

            subject = "Welcome to the UAN Global Referral Program!"
            htmlContent = f"<p>Dear {companyname},</p><br><p>Thank you for registering with UAN Global! We’re thrilled to have you join our " \
                          f"referral program, where your support can help more individuals realize their dreams of studying abroad.</p>" \
                          f"<p>As part of our referral community, you now have a unique referral code that allows you to invite friends, " \
                          f"family, and colleagues to explore opportunities with UAN Global. Each time someone uses your referral code to " \
                          f"join us, you both can enjoy exciting rewards and benefits.</p><br>" \
                          f"<p>Here’s your unique referral code: {unique_id}</p>" \
                          f"<p>Thanks<br>UAN Team</p>"

            sendMail(subject, htmlContent, email)

            adminSubject = "New Referral Submission for UAN Global Referral Program"
            adminHtmlContent = f"<p>Hello Admin,</p><br><p>We are excited to inform you that a new business referral has been submitted. " \
                               f"Below are the details of the referred company:</p><p>Company Name :- {companyname}<br>Company id:- {insert_id}<br>" \
                               f"Company UniqueId:- {unique_id}<br>Mobile :- {mobile}<br>Email :- {email} <br>Address :- {address}</p>" \
                               f"<p>Thanks<br>UAN Team</p>"
            sendMail(adminSubject, adminHtmlContent, "info@uanglobal.com")

            return jsonify({"success": "Success","message": "Your form has been successfully submitted. A unique code has been sent to your email. Please check your inbox","unique_id": unique_id})
        except mysql.Error as e:
            return jsonify({"error": str(e)})

        finally:
            cnx.commit()
            cursor.close()
            cnx.close()

class getRefferralDetails(Resource):
    def get(self):
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        refferals = []
        try:
            sqlGetIndividualRefferals = """SELECT person_id, person_uniqueId, person_firstname, person_phone, person_email, 
                                        COUNT(students.student_id) AS students_count, individualReferral.status FROM individualReferral 
                                        left outer join students ON individualReferral.person_uniqueId=students.refferal_id 
                                        GROUP BY person_id, person_uniqueId, person_firstname, person_phone, person_email"""
            cursor.execute(sqlGetIndividualRefferals)
            individual_refferals_data = cursor.fetchall()

            for row in individual_refferals_data:
                refferals.append({
                    'id': row[0],
                    'refferal_type': 'Individual',
                    'unique_id': row[1],
                    'name': row[2],
                    'phone': row[3],
                    'email': row[4],
                    'students': row[5],
                    'status': row[6]
                })

            sqlGetBusinessRefferals = """SELECT business_id, company_uniqueId, company_name, company_phone, company_email, 
                                    COUNT(students.student_id) AS students_count, business_referral.status FROM business_referral 
                                    left outer join students ON business_referral.company_uniqueId=students.refferal_id 
                                    GROUP BY business_id, company_uniqueId, company_name, company_phone, company_email"""
            cursor.execute(sqlGetBusinessRefferals)
            business_refferals = cursor.fetchall()

            for row in business_refferals:
                refferals.append({
                    'id': row[0],
                    'refferal_type': 'Business',
                    'unique_id': row[1],
                    'name': row[2],
                    'phone': row[3],
                    'email': row[4],
                    'students':row[5],
                    'status': row[6]
                })


        except mysql.Error as e:
            refferals.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return refferals


class getIndividualUser(Resource):
    def post(self):
        data = request.get_json(force=True)
        userId = data['userId']
        userData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetIndividualRefferals = """SELECT person_id, person_uniqueId, person_firstname, person_surname, person_phone, person_email, status
                                    FROM individualReferral where person_id=%s"""
            cursor.execute(sqlGetIndividualRefferals, (userId,))
            individual_refferals_data = cursor.fetchall()
            for row in individual_refferals_data:
                userData.append({
                    'id': row[0],
                    'unique_id': row[1],
                    'name': row[2],
                    'surname': row[3],
                    'phone': row[4],
                    'email': row[5],
                    'status':row[6]
                })
        except mysql.Error as e:
            userData.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return userData

class getBusinessUser(Resource):
    def post(self):
        data = request.get_json(force=True)
        userId = data['userId']
        userData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlGetBusinessRefferals = """SELECT business_id, company_uniqueId, company_name, company_phone, company_email, company_url, company_address,
                                    status FROM business_referral where business_id=%s"""
            cursor.execute(sqlGetBusinessRefferals, (userId,))
            business_refferals = cursor.fetchall()
            for row in business_refferals:
                userData.append({
                    'id': row[0],
                    'unique_id': row[1],
                    'name': row[2],
                    'phone': row[3],
                    'email': row[4],
                    'url': row[5],
                    'address': row[6],
                    'status': row[7]
                })


        except mysql.Error as e:
            userData.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return userData

class updateIndividualRefferal(Resource):
    def post(self):
        data = request.get_json(force=True)
        userId = data['userId']
        name = data['name']
        surname = data['surname']
        email = data['email']
        phone = data['phone']
        status = data['status']
        userUpdateData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlUpdateIndividualRefferals = """update individualReferral set person_firstname=%s, person_surname=%s, person_phone=%s, person_email=%s, status=%s
                                        where person_id=%s"""
            cursor.execute(sqlUpdateIndividualRefferals, (name, surname, phone, email, status, userId,))
            userUpdateData.append({"status":"Success", "message": "Person Updated SuccessFully"})
        except mysql.Error as e:
            userUpdateData.append({"status": "Error", "message": str(e)})
        finally:
            cnx.commit()
            cursor.close()

        return userUpdateData

class updateBusinessRefferal(Resource):
    def post(self):
        data = request.get_json(force=True)
        userId = data['userId']
        name = data['name']
        url = data['url']
        email = data['email']
        phone = data['phone']
        address = data['address']
        status = data['status']
        userUpdateData = []
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        try:
            sqlUpdateBusinessRefferals = """update business_referral set company_name=%s, company_phone=%s, company_email=%s, company_url=%s, company_address=%s,
                                        status=%s where business_id=%s"""
            cursor.execute(sqlUpdateBusinessRefferals, (name, phone, email, url, address, status, userId,))
            userUpdateData.append({"status":"Success", "message": "Person Updated SuccessFully"})
        except mysql.Error as e:
            userUpdateData.append({"status": "Error", "message": str(e)})
        finally:
            cnx.commit()
            cursor.close()

        return userUpdateData


class getActiveRefferrals(Resource):
    def get(self):
        cnx = mysql.connect(user=dbUser, password=dbPassword, database=dataBase)
        cursor = cnx.cursor()
        refferals = []
        try:
            sqlGetIndividualRefferals = """SELECT person_id, person_uniqueId, person_firstname, person_phone, person_email FROM individualReferral
                                        where status=%s"""
            cursor.execute(sqlGetIndividualRefferals, ("Active",))
            individual_refferals_data = cursor.fetchall()

            for row in individual_refferals_data:
                refferals.append({
                    'id': row[0],
                    'refferal_type': 'Indivdual',
                    'unique_id': row[1],
                    'name': row[2],
                    'phone': row[3],
                    'email': row[4]
                })

            sqlGetBusinessRefferals = """SELECT business_id, company_uniqueId, company_name, company_phone, company_email FROM business_referral
                                    where status=%s"""
            cursor.execute(sqlGetBusinessRefferals, ("Active",))
            business_refferals = cursor.fetchall()

            for row in business_refferals:
                refferals.append({
                    'id': row[0],
                    'refferal_type': 'Business',
                    'unique_id': row[1],
                    'name': row[2],
                    'phone': row[3],
                    'email': row[4],
                })


        except mysql.Error as e:
            refferals.append(str(e))
        finally:
            cnx.commit()
            cursor.close()

        return refferals

cipher = AESCipher('OnePlaceMyPlaceJamboUrl111019808')

# NewChanges
api.add_resource(uanLogin, '/uanLogin')
api.add_resource(getOffices, '/getOffices')
api.add_resource(student_register, '/student_register')
api.add_resource(addStudent, '/addStudent')
api.add_resource(bulkStudentAdd, '/bulkStudentAdd')
api.add_resource(getCountOfDashboard, '/getCountOfDashboard')
api.add_resource(getUnAssignedAllStudents, '/getUnAssignedAllStudents')
api.add_resource(getassignedAllStudents, '/getassignedAllStudents')
api.add_resource(getUnassignedStudents, '/getUnassignedStudents')
api.add_resource(getAssignedStudents, '/getAssignedStudents')
api.add_resource(updateCounsilor, '/updateCounsilor')
api.add_resource(getAllStudents, '/getAllStudents')
api.add_resource(searchStudents, '/searchStudents')
api.add_resource(personalUpdate, '/personalUpdate')
api.add_resource(statusUpdate, '/statusUpdate')
api.add_resource(addStudentNotes, '/addStudentNotes')
api.add_resource(getStudentNotes, '/getStudentNotes')
api.add_resource(addNewApplication, '/addNewApplication')
api.add_resource(getApplicationData, '/getApplicationData')
api.add_resource(offerFileUpload, '/offerFileUpload')
api.add_resource(getOfferFile, '/getOfferFile')
api.add_resource(applicationUpdate, '/applicationUpdate')
api.add_resource(deleteApplication, '/deleteApplication')
api.add_resource(checkItsFinalChoice, '/checkItsFinalChoice')
api.add_resource(getStudentFinalChoicedCount, '/getStudentFinalChoicedCount')
api.add_resource(addFinalChoice, '/addFinalChoice')
api.add_resource(removeFinalChoice, '/removeFinalChoice')
api.add_resource(getFinalChoicedData, '/getFinalChoicedData')
api.add_resource(editApplication, '/editApplication')
api.add_resource(deleteStudent, '/deleteStudent')
api.add_resource(getUsers, '/getUsers')
api.add_resource(searchUser, '/searchUser')
api.add_resource(addUser, '/addUser')
api.add_resource(updateUser, '/updateUser')
api.add_resource(deleteUser, '/deleteUser')
api.add_resource(searchOffice, '/searchOffice')
api.add_resource(getManagers, '/getManagers')
api.add_resource(updateOffice, '/updateOffice')
api.add_resource(deleteOffice, '/deleteOffice')
api.add_resource(addOffice, '/addOffice')
api.add_resource(getCounselors, '/getCounselors')
api.add_resource(getCounsilorStudents, '/getCounsilorStudents')
api.add_resource(getManagerCount, '/getManagerCount')
api.add_resource(getStaffEmailCount, '/getStaffEmailCount')
api.add_resource(getOfficeWithManager, '/getOfficeWithManager')

# phase2 changes
api.add_resource(getSelectedData, '/getSelectedData')
api.add_resource(getApplications, '/getApplications')
api.add_resource(getAllFinalChoicedApplication, '/getAllFinalChoicedApplication')
api.add_resource(getUnassignedStudentsYear, '/getUnassignedStudentsYear')
api.add_resource(getApplicationCountYear, '/getApplicationCountYear')
api.add_resource(getApplicationCSDReport, '/getApplicationCSDReport')
api.add_resource(getApplicationASDReport, '/getApplicationASDReport')
api.add_resource(getOfficesCounsilors, '/getOfficesCounsilors')
api.add_resource(getFinalChoiceCSDReport, '/getFinalChoiceCSDReport')
api.add_resource(getFinalChoiceASDReport, '/getFinalChoiceASDReport')
api.add_resource(getStudentManagerEDReport, '/getStudentManagerEDReport')
api.add_resource(getStaticCount, '/getStaticCount')
api.add_resource(getStudentLogReport, '/getStudentLogReport')
api.add_resource(updateReminderNoteStatus, '/updateReminderNoteStatus')
# api.add_resource(sendReminderMail, '/sendReminderMail')
api.add_resource(getMissedReminderReport, '/getMissedReminderReport')
api.add_resource(getUserMissedReport, '/getUserMissedReport')
api.add_resource(getApplicantReport, '/getApplicantReport')
api.add_resource(getStudentList, '/getStudentList')
api.add_resource(getStaffApplicationASDReport, '/getStaffApplicationASDReport')
api.add_resource(getStaffApplicationCSDReport, '/getStaffApplicationCSDReport')
api.add_resource(getStaffApplicationASDStaffCount, '/getStaffApplicationASDStaffCount')
api.add_resource(getStaffApplicationCSDStaffCount, '/getStaffApplicationCSDStaffCount')
api.add_resource(bookCounseling, '/bookCounseling')
api.add_resource(getNote, '/getNote')
api.add_resource(updateStudentNotes, '/updateStudentNotes')
api.add_resource(reAssignStudents, '/reAssignStudents')
api.add_resource(getCounsilorAllStudents, '/getCounsilorAllStudents')
api.add_resource(getOfficeStudents, '/getOfficeStudents')
api.add_resource(getOfficeAllCounsilors, '/getOfficeAllCounsilors')
api.add_resource(getCounsilorCount, '/getCounsilorCount')
api.add_resource(reAssignCounselors, '/reAssignCounselors')
api.add_resource(activateUser, '/activateUser')
api.add_resource(activateOffice, '/activateOffice')
api.add_resource(getApplicationCSDCount, '/getApplicationCSDCount')
api.add_resource(getApplicationASDCount, '/getApplicationASDCount')
api.add_resource(getUserReminderNotes, '/getUserReminderNotes')

# phase3 changes
api.add_resource(addInstitution, '/addInstitution')
api.add_resource(getInstitution, '/getInstitution')
api.add_resource(getInstitutionWithId, '/getInstitutionWithId')
api.add_resource(getInstitutionsName, '/getInstitutionsName')
api.add_resource(getInstitutionProfile, '/getInstitutionProfile')
api.add_resource(getCountryInstitutionProfile, '/getCountryInstitutionProfile')
api.add_resource(updateInstitutionProfile, '/updateInstitutionProfile')
api.add_resource(updateContractFiles, '/updateContractFiles')
api.add_resource(getApplicationsInstitutionProfileASDReport, '/getApplicationsInstitutionProfileASDReport')
api.add_resource(getApplicationsInstitutionProfileCSDReport, '/getApplicationsInstitutionProfileCSDReport')
api.add_resource(getApplicationsInstitutionProfileYearCountASDReport,
                 '/getApplicationsInstitutionProfileYearCountASDReport')
api.add_resource(getApplicationsInstitutionProfileYearCountCSDReport,
                 '/getApplicationsInstitutionProfileYearCountCSDReport')
api.add_resource(getFinalChoicesInstitutionProfileASDReport, '/getFinalChoicesInstitutionProfileASDReport')
api.add_resource(getFinalChoicessInstitutionProfileCSDReport, '/getFinalChoicessInstitutionProfileCSDReport')
api.add_resource(getFinalChoicesInstitutionCourseTypeASDCount, '/getFinalChoicesInstitutionCourseTypeASDCount')
api.add_resource(getFinalChoicesInstitutionCourseTypeCSDCount, '/getFinalChoicesInstitutionCourseTypeCSDCount')
api.add_resource(contractFileUpload, '/contractFileUpload')
api.add_resource(getContractFile, '/getContractFile')
api.add_resource(getCommissionDetails, '/getCommissionDetails')
api.add_resource(addInstitutionNotes, '/addInstitutionNotes')
api.add_resource(getInstitutionNotes, '/getInstitutionNotes')
api.add_resource(deleteInstitutionNote, '/deleteInstitutionNote')
api.add_resource(getApplicationInvoiceDetails, '/getApplicationInvoiceDetails')
api.add_resource(updateApplicationInvoiceDetails, '/updateApplicationInvoiceDetails')
api.add_resource(submitCommission, '/submitCommission')
api.add_resource(deleteCommissionRate, '/deleteCommissionRate')

# phase4 changes
api.add_resource(addPartner, '/addPartner')
api.add_resource(getPartners, '/getPartners')
api.add_resource(getPartnersDetails, '/getPartnersDetails')
api.add_resource(getPartnerWithId, '/getPartnerWithId')
api.add_resource(updatePartner, '/updatePartner')
api.add_resource(getApplicationsPartnerASDReport, '/getApplicationsPartnerASDReport')
api.add_resource(getApplicationsPartnerCSDReport, '/getApplicationsPartnerCSDReport')
api.add_resource(getApplicationsPartnerYearCountCSDReport, '/getApplicationsPartnerYearCountCSDReport')
api.add_resource(getApplicationsPartnerYearCountASDReport, '/getApplicationsPartnerYearCountASDReport')
api.add_resource(getFinalChoicesPartnerASDReport, '/getFinalChoicesPartnerASDReport')
api.add_resource(getFinalChoicessPartnerCSDReport, '/getFinalChoicessPartnerCSDReport')
api.add_resource(getFinalChoicesPartnerCourseTypeASDCount, '/getFinalChoicesPartnerCourseTypeASDCount')
api.add_resource(getFinalChoicesPartnerCourseTypeCSDCount, '/getFinalChoicesPartnerCourseTypeCSDCount')
api.add_resource(getPartnerWithOfficeId, '/getPartnerWithOfficeId')
api.add_resource(partnerContractFileUpload, '/partnerContractFileUpload')
api.add_resource(getPartnerContractFile, '/getPartnerContractFile')
api.add_resource(updatePartnerContractFiles, '/updatePartnerContractFiles')
api.add_resource(getPartnerContractFileList, '/getPartnerContractFileList')
api.add_resource(addPartnerNotes, '/addPartnerNotes')
api.add_resource(getPartnerNotes, '/getPartnerNotes')
api.add_resource(deletePartnerNote, '/deletePartnerNote')
api.add_resource(updatePartnerCredential, '/updatePartnerCredential')
api.add_resource(sendPartnerCredential, '/sendPartnerCredential')
api.add_resource(getPartnerPassword, '/getPartnerPassword')
api.add_resource(addPartnerStudent, '/addPartnerStudent')
api.add_resource(getPartnerStudents, '/getPartnerStudents')
api.add_resource(getPartnerStudentManagerEDReport, '/getPartnerStudentManagerEDReport')
api.add_resource(getPartnerStaticCount, '/getPartnerStaticCount')
api.add_resource(getCountOfPartnerDashboard, '/getCountOfPartnerDashboard')
api.add_resource(getAllPartnerStudents, '/getAllPartnerStudents')
api.add_resource(getPartnerStudentNotes, '/getPartnerStudentNotes')
api.add_resource(addPartnerStudentNotes, '/addPartnerStudentNotes')
api.add_resource(getPartnerYearStudents, '/getPartnerYearStudents')
api.add_resource(getPartnerApplications, '/getPartnerApplications')
api.add_resource(getPartnerFinalChoicedApplication, '/getPartnerFinalChoicedApplication')
api.add_resource(getStaffCount, '/getStaffCount')
api.add_resource(partnerStatusUpdate, '/partnerStatusUpdate')
api.add_resource(getPartnerReportApplicationCountASD, '/getPartnerReportApplicationCountASD')
api.add_resource(getPartnerReportApplicationCountCSD, '/getPartnerReportApplicationCountCSD')
api.add_resource(getPartnerReportApplicationsASD, '/getPartnerReportApplicationsASD')
api.add_resource(getPartnerReportApplicationsCSD, '/getPartnerReportApplicationsCSD')
api.add_resource(getYearlyPartnerProfilePerformance, '/getYearlyPartnerProfilePerformance')
api.add_resource(getManagerUsers, '/getManagerUsers')
api.add_resource(getManagerStaffCount, '/getManagerStaffCount')
api.add_resource(bulkAssignStudents, '/bulkAssignStudents')
api.add_resource(managerBulkAssignStudents, '/managerBulkAssignStudents')
api.add_resource(studentDocumentUpload, '/studentDocumentUpload')
api.add_resource(getStudentDocumentList, '/getStudentDocumentList')
api.add_resource(updateStudentDocument, '/updateStudentDocument')
api.add_resource(getStudentDocument, '/getStudentDocument')
api.add_resource(getCounsellorMissedReminderReport, '/getCounsellorMissedReminderReport')

api.add_resource(addFranchise, '/addFranchise')
api.add_resource(getFranchiseDetails, '/getFranchiseDetails')
api.add_resource(getFranchises, '/getFranchises')
api.add_resource(getFranchiseWithId, '/getFranchiseWithId')

api.add_resource(getStudentLogNotes, '/getStudentLogNotes')
api.add_resource(getStudentActivityLogNotes, '/getStudentActivityLogNotes')

api.add_resource(getFranchisePassword, '/getFranchisePassword')
api.add_resource(updateFranchiseCredential, '/updateFranchiseCredential')
api.add_resource(sendFranchiseCredential, '/sendFranchiseCredential')
api.add_resource(addFranchiseStudent, '/addFranchiseStudent')
api.add_resource(getCountOfFranchiseDashboard, '/getCountOfFranchiseDashboard')
api.add_resource(getAllFranchiseStudents, '/getAllFranchiseStudents')
api.add_resource(getFranchiseStudents, '/getFranchiseStudents')
api.add_resource(getFranchiseWithOfficeId, '/getFranchiseWithOfficeId')
api.add_resource(franchiseStatusUpdate, '/franchiseStatusUpdate')
api.add_resource(getFranchiseYearStudents, '/getFranchiseYearStudents')
api.add_resource(addFranchiseStudentNotes, '/addFranchiseStudentNotes')
api.add_resource(getFranchiseStudentNotes, '/getFranchiseStudentNotes')
api.add_resource(getFranchiseStaticCount, '/getFranchiseStaticCount')
api.add_resource(getFranchiseStudentManagerEDReport, '/getFranchiseStudentManagerEDReport')
api.add_resource(getFranchiseApplications, '/getFranchiseApplications')
api.add_resource(getFranchiseFinalChoicedApplication, '/getFranchiseFinalChoicedApplication')
api.add_resource(getApplicationsFranchiseASDReport, '/getApplicationsFranchiseASDReport')
api.add_resource(getApplicationsFranchiseCSDReport, '/getApplicationsFranchiseCSDReport')
api.add_resource(getApplicationsFranchiseYearCountASDReport, '/getApplicationsFranchiseYearCountASDReport')
api.add_resource(getApplicationsFranchiseYearCountCSDReport, '/getApplicationsFranchiseYearCountCSDReport')
api.add_resource(getYearlyFranchiseProfilePerformance, '/getYearlyFranchiseProfilePerformance')
api.add_resource(getFinalChoicesFranchiseASDReport, '/getFinalChoicesFranchiseASDReport')
api.add_resource(getFinalChoicessFranchiseCSDReport, '/getFinalChoicessFranchiseCSDReport')
api.add_resource(franchiseContractFileUpload, '/franchiseContractFileUpload')
api.add_resource(getFranchiseContractFile, '/getFranchiseContractFile')
api.add_resource(updateFranchiseContractFiles, '/updateFranchiseContractFiles')
api.add_resource(getFranchiseContractFileList, '/getFranchiseContractFileList')
api.add_resource(getFranchiseNotes, '/getFranchiseNotes')
api.add_resource(addFranchiseNotes, '/addFranchiseNotes')
api.add_resource(deleteFranchiseNote, '/deleteFranchiseNote')
api.add_resource(updateFranchise, '/updateFranchise')
api.add_resource(getFinalChoicesFranchiseCourseTypeASDCount, '/getFinalChoicesFranchiseCourseTypeASDCount')
api.add_resource(getFinalChoicesFranchiseCourseTypeCSDCount, '/getFinalChoicesFranchiseCourseTypeCSDCount')
api.add_resource(getFranchiseReportApplicationsASD, '/getFranchiseReportApplicationsASD')
api.add_resource(getFranchiseReportApplicationsCSD, '/getFranchiseReportApplicationsCSD')
api.add_resource(getFranchiseReportApplicationCountASD, '/getFranchiseReportApplicationCountASD')
api.add_resource(getFranchiseReportApplicationCountCSD, '/getFranchiseReportApplicationCountCSD')
api.add_resource(getSelectedReassignData, '/getSelectedReassignData')
api.add_resource(getInstitutionReport, '/getInstitutionReport')

api.add_resource(individualReferralInsert, '/individualReferralInsert')
api.add_resource(businessReferralInsert, '/businessReferralInsert')
api.add_resource(getRefferralDetails, '/getRefferralDetails')
api.add_resource(getIndividualUser, '/getIndividualUser')
api.add_resource(getBusinessUser, '/getBusinessUser')
api.add_resource(updateIndividualRefferal, '/updateIndividualRefferal')
api.add_resource(updateBusinessRefferal, '/updateBusinessRefferal')
api.add_resource(getActiveRefferrals, '/getActiveRefferrals')

