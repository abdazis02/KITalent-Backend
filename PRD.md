# PRD SUPER LENGKAP — KITalent

**Nama Produk:** KITalent
**Jenis Produk:** Outsourcing Management Platform + SaaS HRIS Platform  
**Platform:** Web Admin/Portal + Mobile App Android/iOS  
**Status Dokumen:** Product Requirement Document Full Version — Revisi Theme & Localization  
**Tanggal:** 31 Mei 2026  
**Versi Revisi:** v1.1 — Wajib Light/Dark Mode + Bilingual Indonesia/English  
**Target Eksekusi:** AI Agent / Development Team  
**Catatan Penting:** Dokumen ini menjadi sumber kebenaran utama. Jangan menambah, mengurangi, atau mengubah scope tanpa revisi PRD.

> **Revisi wajib:** Seluruh aplikasi web dan mobile harus mendukung **mode Light dan Dark** serta **dua bahasa yang dapat diganti pengguna: Bahasa Indonesia (`id-ID`) dan English (`en-US`)**. Tidak boleh ada text UI yang hardcoded hanya dalam satu bahasa.

---

## 0. INSTRUKSI WAJIB UNTUK AI AGENT

AI agent yang mengeksekusi PRD ini **wajib** mengikuti aturan berikut:

1. Bangun aplikasi hanya untuk **2 mode utama**:
   - **Outsourcing Mode**
   - **SaaS HRIS Mode**

2. **Jangan membuat Internal Mode terpisah.**  
   PT Kamunara Group International tetap ada sebagai operator/pengelola pada Outsourcing Mode, bukan mode produk terpisah.

3. Semua fitur harus mendukung:
   - Multi-tenant
   - Multi-company
   - Multi-role
   - Role-Based Access Control
   - Approval workflow bertingkat
   - Audit log
   - Soft delete
   - File upload ke MinIO
   - Notification system
   - API-first architecture
   - Web dashboard
   - Mobile app Flutter
   - Theme system Light Mode dan Dark Mode
   - Multi-language UI Bahasa Indonesia dan English

4. Jangan hardcode data penting seperti role, permission, status, approval, paket langganan, lokasi, payroll component, tipe dokumen, theme, bahasa, atau text UI.

5. Semua operasi penting harus memiliki audit log:
   - Login/logout
   - Create/update/delete data
   - Approval/rejection
   - Payroll run
   - Invoice generation
   - Contract generation/signing
   - Attendance correction
   - Data export
   - Role/permission change

6. Semua entity utama wajib memiliki field standar:
   - `id`
   - `tenant_id` jika data tenant-specific
   - `created_at`
   - `updated_at`
   - `deleted_at`
   - `created_by`
   - `updated_by`
   - `deleted_by`

7. Gunakan UUID untuk primary key, bukan auto increment integer, agar aman untuk multi-tenant dan integrasi.

8. Semua endpoint backend wajib:
   - Memakai DTO
   - Memakai validation
   - Memakai guard auth
   - Memakai permission guard
   - Memakai tenant guard
   - Memakai pagination untuk list
   - Memakai filter dan search jika relevan
   - Memiliki Swagger/OpenAPI documentation

9. Semua upload file wajib melalui file service dan disimpan di MinIO, bukan langsung di folder public backend.

10. Semua data sensitif wajib dienkripsi atau diproteksi:
    - Password wajib bcrypt/argon2
    - Refresh token wajib hash
    - Nomor rekening, NIK, NPWP, BPJS, dokumen identitas wajib dibatasi aksesnya
    - Salary/payroll hanya bisa dilihat role berwenang

11. Semua fitur payroll, BPJS, pajak, lembur, cuti, kontrak, dan aturan ketenagakerjaan dibuat **configurable** karena regulasi dan kebijakan perusahaan dapat berubah.

12. Jangan membuat UI generik/template. UI harus terlihat premium, tegas, clean, dan konsisten dengan branding KITalent pada **Light Mode** dan **Dark Mode**.

13. Semua UI text wajib menggunakan sistem i18n/translation key. Bahasa default adalah **Bahasa Indonesia (`id-ID`)**, bahasa tambahan wajib adalah **English (`en-US`)**. User bisa mengganti bahasa dari login page, profile, dan settings.

14. Theme preference wajib dapat dipilih: `system`, `light`, atau `dark`. Preference disimpan lokal di device/browser dan disinkronkan ke backend untuk user yang login.

15. Semua modul harus tetap berjalan walaupun tenant menggunakan mode berbeda:
    - Tenant Outsourcing bisa memakai modul client, placement, invoice.
    - Tenant SaaS HRIS bisa memakai modul HRIS tanpa outsourcing.
    - Tenant hybrid dapat memakai keduanya jika paketnya mengaktifkan keduanya.

---

## 1. RINGKASAN PRODUK

**KITalent** adalah platform digital berbasis web dan mobile untuk mengelola tenaga kerja outsourcing dan sistem HRIS perusahaan secara mandiri.

Produk ini memiliki dua mode utama:

### 1.1 Outsourcing Mode

Mode untuk mengelola seluruh siklus layanan outsourcing tenaga kerja dari PT Kamunara Group International kepada client, mulai dari permintaan tenaga kerja, rekrutmen, seleksi, kontrak kerja, penempatan, absensi, jadwal, payroll, invoice, evaluasi performa, laporan, sampai perpanjangan kontrak.

### 1.2 SaaS HRIS Mode

Mode untuk perusahaan yang ingin menggunakan KITalent sebagai sistem HRIS mandiri seperti Talenta/Mekari. Perusahaan dapat mengelola struktur organisasi, karyawan, absensi, cuti, lembur, payroll, slip gaji, approval, reimbursement, dokumen, performa, dan employee self-service.

---

## 2. VISI PRODUK

Menjadi platform workforce management dan HRIS modern yang membantu perusahaan mengelola tenaga kerja secara lebih efisien, transparan, terukur, aman, dan siap digunakan untuk kebutuhan outsourcing maupun HR internal perusahaan.

---

## 3. MISI PRODUK

1. Menyediakan sistem terpadu untuk pengelolaan tenaga kerja outsourcing.
2. Menyediakan HRIS SaaS yang bisa digunakan banyak perusahaan.
3. Memudahkan absensi, cuti, payroll, jadwal, dokumen, dan approval.
4. Meningkatkan transparansi antara penyedia tenaga kerja, client, dan karyawan.
5. Mengurangi proses manual dalam HR, payroll, dan operasional lapangan.
6. Menyediakan laporan real-time untuk keputusan manajemen.
7. Menjamin keamanan data karyawan, client, payroll, dan dokumen legal.

---

## 4. MASALAH YANG DISELESAIKAN

### 4.1 Masalah pada Outsourcing

- Permintaan tenaga kerja dari client masih manual.
- Data kandidat dan karyawan tercecer.
- Penempatan karyawan sulit dilacak.
- Absensi lapangan sulit diverifikasi.
- Payroll dan invoice rawan selisih.
- Kontrak kerja dan kontrak client sulit dimonitor.
- Client tidak punya visibility real-time terhadap tenaga kerja.
- Supervisor lapangan sulit membuat laporan performa.
- Dokumen karyawan sering tidak lengkap.
- Proses penggantian tenaga kerja lambat.
- Riwayat mutasi, rotasi, dan kontrak tidak terdokumentasi baik.

### 4.2 Masalah pada HRIS SaaS

- Perusahaan kecil/menengah belum punya HRIS lengkap.
- Absensi, cuti, lembur, payroll, dan slip gaji masih manual.
- Approval masih lewat WhatsApp/email.
- Struktur organisasi tidak terdigitalisasi.
- Data karyawan dan dokumen tidak tersentralisasi.
- Payroll tidak terintegrasi dengan absensi dan cuti.
- Manajemen tidak memiliki dashboard HR real-time.
- Tidak ada audit trail pada perubahan data HR.

---

## 5. TUJUAN PRODUK

1. Membuat platform outsourcing end-to-end.
2. Membuat HRIS SaaS full-featured.
3. Menyediakan mobile app untuk semua role penting.
4. Menyediakan web dashboard untuk admin, HR, client, payroll, finance, dan management.
5. Menyediakan payroll engine configurable.
6. Menyediakan attendance engine dengan GPS, selfie, dan fingerprint integration.
7. Menyediakan approval workflow dinamis.
8. Menyediakan contract management digital.
9. Menyediakan reporting dan analytics.
10. Menyediakan integrasi enterprise.
11. Menyediakan theme Light/Dark yang konsisten di web dan mobile.
12. Menyediakan bilingual UI Bahasa Indonesia dan English untuk seluruh role, modul, notifikasi, validasi, dan dokumen sistem.

---

## 6. MODE APLIKASI

## 6.1 Outsourcing Mode

### Tujuan

Digunakan untuk mengelola layanan penyediaan tenaga kerja kepada client.

### Aktor Utama

- Kamunara Group International sebagai operator outsourcing
- Client sebagai pengguna jasa
- Karyawan outsourcing sebagai tenaga kerja
- Candidate sebagai pelamar

### Modul Utama

1. Client Management
2. Service Catalog
3. Manpower Request
4. Recruitment
5. Candidate Management
6. Contract Management
7. Employee Management
8. Placement Management
9. Shift & Schedule
10. Attendance
11. Leave & Permission
12. Overtime
13. Payroll
14. Invoice & Billing
15. Performance Evaluation
16. Incident Report
17. Replacement Request
18. Document Management
19. Client Portal
20. Reporting

---

## 6.2 SaaS HRIS Mode

### Tujuan

Digunakan oleh perusahaan sebagai sistem HRIS mandiri.

### Aktor Utama

- Company Owner
- HR Manager
- HR Admin
- Payroll Admin
- Finance Admin
- Department Head
- Manager
- Supervisor
- Employee
- Auditor

### Modul Utama

1. Company Management
2. Organization Structure
3. Employee Database
4. Attendance
5. Shift & Schedule
6. Leave
7. Permission
8. Overtime
9. Payroll
10. Salary Slip
11. Reimbursement
12. Loan/Cash Advance
13. Performance Management
14. Asset Management
15. Document Management
16. Contract Management
17. Employee Self-Service
18. Approval Workflow
19. Notification
20. Reporting

---

## 7. MODEL BISNIS

### 7.1 Outsourcing Service Fee

Client membayar biaya jasa outsourcing berdasarkan:
- Jumlah tenaga kerja
- Jenis pekerjaan
- Lokasi kerja
- Durasi kontrak
- Shift
- Komponen gaji
- Benefit
- BPJS
- Pajak
- Fee management
- Margin perusahaan

### 7.2 Managed Payroll

Payroll karyawan outsourcing dikelola oleh penyedia outsourcing. Client membayar invoice bulanan berdasarkan hasil payroll dan komponen jasa.

### 7.3 Client Payroll

Client memakai tenaga kerja outsourcing tetapi payroll dapat dibayarkan langsung oleh client. Sistem tetap mencatat absensi, performa, kontrak, dan laporan.

### 7.4 Hybrid Payroll

Sebagian komponen dibayar penyedia outsourcing, sebagian dibayar client. Contoh:
- Gaji pokok oleh penyedia
- Uang makan oleh client
- Bonus oleh client
- BPJS oleh penyedia
- Insentif oleh client

### 7.5 SaaS Subscription

Perusahaan membayar langganan HRIS:
- Starter
- Professional
- Enterprise
- Custom

### 7.6 Per Employee Pricing

Biaya dihitung berdasarkan jumlah karyawan aktif per bulan.

### 7.7 Add-On Feature Pricing

Fitur tambahan yang bisa menjadi add-on:
- Fingerprint integration
- WhatsApp notification
- E-signature
- Advanced payroll
- Advanced analytics
- Custom report
- API integration
- Dedicated storage
- White-label tenant

---

## 8. USER ROLE LENGKAP

## 8.1 Platform Level

| Role | Deskripsi |
|---|---|
| Super Admin Platform | Pengelola tertinggi seluruh sistem |
| Platform Owner | Pemilik produk/platform |
| Platform Support | Bantuan teknis tenant |
| Billing Admin Platform | Mengelola subscription, invoice SaaS, pembayaran platform |
| System Auditor | Melihat audit, log, dan compliance tanpa mengubah data |

## 8.2 Outsourcing Operator Level

| Role | Deskripsi |
|---|---|
| Outsourcing Owner | Pemilik/management penyedia outsourcing |
| Operation Manager | Mengelola operasional client dan penempatan |
| HR Manager | Mengelola HR, employee, kontrak, aturan kerja |
| HR Admin | Input dan maintenance data karyawan |
| Recruitment Manager | Mengelola proses rekrutmen |
| Recruitment Officer | Screening, interview, seleksi kandidat |
| Payroll Manager | Approval payroll |
| Payroll Officer | Proses payroll bulanan |
| Finance Manager | Approval invoice dan pembayaran |
| Finance Officer | Membuat invoice, pembayaran, rekonsiliasi |
| Legal Officer | Mengelola kontrak dan dokumen legal |
| Area Coordinator | Koordinator wilayah/lokasi |
| Site Supervisor | Supervisor lapangan di lokasi client |
| PIC Lapangan | Monitoring kehadiran dan laporan harian |
| Document Admin | Mengelola dokumen karyawan/client |
| Report Analyst | Membuat dan membaca laporan |

## 8.3 Client Level pada Outsourcing Mode

| Role | Deskripsi |
|---|---|
| Client Owner | Pemilik akun client |
| Client Admin | Mengelola user dan data client |
| Client HR | Mengelola tenaga kerja di sisi client |
| Client Finance | Melihat invoice, billing, pembayaran |
| Client Supervisor | Monitoring tenaga kerja dan approve request |
| Client Approver | Approval permintaan tenaga kerja, overtime, invoice |
| Client Viewer | Hanya melihat laporan |
| Client Auditor | Melihat data audit dan compliance client |

## 8.4 SaaS HRIS Company Level

| Role | Deskripsi |
|---|---|
| Company Owner | Pemilik tenant perusahaan |
| Company Admin | Pengelola tenant perusahaan |
| HR Manager | Mengelola HR perusahaan |
| HR Admin | Input data karyawan dan administrasi HR |
| Payroll Manager | Approval payroll |
| Payroll Admin | Proses payroll |
| Finance Admin | Mengelola reimbursement dan pembayaran |
| Department Head | Kepala departemen |
| Manager | Atasan langsung karyawan |
| Supervisor | Approval operasional tim |
| Approver | Role khusus approval |
| Employee | Karyawan pengguna mobile/self-service |
| Auditor/Viewer | Hanya melihat laporan dan data tertentu |

## 8.5 Employee/Candidate Level

| Role | Deskripsi |
|---|---|
| Candidate | Pelamar kerja |
| Shortlisted Candidate | Kandidat lolos screening awal |
| Interview Candidate | Kandidat masuk tahap interview |
| Accepted Candidate | Kandidat diterima |
| Rejected Candidate | Kandidat ditolak |
| Employee | Karyawan aktif |
| Team Leader | Karyawan yang memimpin tim |
| Resigned Employee | Karyawan resign |
| Terminated Employee | Karyawan diberhentikan |
| Blacklisted Candidate/Employee | Tidak dapat direkrut kembali |

---

## 9. PERMISSION MATRIX RINGKAS

Permission harus dibuat granular dan configurable.

### 9.1 Format Permission

Gunakan format:

```txt
module.action.scope
```

Contoh:

```txt
employee.create.tenant
employee.read.own
employee.read.department
employee.read.all
payroll.process.tenant
payroll.approve.tenant
invoice.create.client
attendance.create.own
attendance.approve.team
```

### 9.2 Action Standar

- `create`
- `read`
- `update`
- `delete`
- `restore`
- `approve`
- `reject`
- `export`
- `import`
- `assign`
- `archive`
- `download`
- `upload`
- `generate`
- `process`
- `sync`

### 9.3 Scope Standar

- `own`
- `team`
- `department`
- `branch`
- `location`
- `client`
- `company`
- `tenant`
- `all`

---

## 10. FITUR LENGKAP PER MODUL

# 10.1 Authentication & Security

## Fitur

- Login email/password
- Login nomor HP/password opsional
- Login role-based
- Multi-tenant login
- Refresh token
- Logout
- Forgot password
- Reset password
- Change password
- Force change password
- Two-Factor Authentication opsional
- Device management
- Session management
- Login history
- Account lock after failed attempts
- Password policy
- CAPTCHA opsional
- SSO integration opsional
- JWT access token
- Refresh token rotation
- Redis session/token blacklist
- Role and permission guard
- Tenant isolation guard

## Acceptance Criteria

- User tidak bisa mengakses tenant lain.
- User hanya bisa mengakses menu sesuai role/permission.
- Refresh token lama invalid setelah rotation.
- Semua login/logout masuk audit log.
- Password tidak pernah disimpan plain text.

---

# 10.2 Tenant & Subscription Management

## Fitur

- Create tenant
- Update tenant
- Activate/deactivate tenant
- Tenant mode:
  - Outsourcing
  - SaaS HRIS
  - Hybrid
- Tenant package/plan
- Subscription period
- Trial period
- Payment status
- Feature flag per tenant
- User limit
- Employee limit
- Storage limit
- API limit
- Branding tenant
- Custom domain opsional
- White-label opsional

## Field Penting

- Tenant name
- Legal name
- Business type
- Tax number
- Address
- Contact person
- Email
- Phone
- Active modules
- Plan
- Billing status

---

# 10.3 Company Management

## Fitur

- Data perusahaan
- Cabang
- Lokasi kerja
- Geofence lokasi
- Jam kerja default
- Kalender libur
- Struktur organisasi
- Divisi/departemen
- Jabatan
- Level jabatan
- Cost center
- Approval hierarchy
- Company policy
- Payroll policy
- Attendance policy
- Leave policy
- Overtime policy
- Document template

---

# 10.4 Organization Structure & Hierarchy

## Fitur

- Departemen
- Sub-departemen
- Posisi/jabatan
- Job level
- Grade
- Supervisor/manager relation
- Struktur hirarki visual
- Approval chain otomatis berdasarkan atasan
- Matrix organization opsional
- Temporary approver
- Delegation approval
- Acting position
- History perubahan struktur

## Business Rules

- Setiap employee bisa punya direct supervisor.
- Approval bisa berdasarkan:
  - Direct supervisor
  - Department head
  - HR
  - Payroll
  - Finance
  - Custom approver
- Perubahan supervisor tidak boleh menghapus riwayat approval lama.

---

# 10.5 Employee Management

## Fitur

- Employee master data
- Employee ID/NIP
- Foto profil
- Data personal
- Data kontak
- Data alamat
- Data keluarga
- Emergency contact
- Pendidikan
- Pengalaman kerja
- Skill/kompetensi
- Sertifikasi
- Data bank
- Data BPJS
- Data NPWP/pajak
- Dokumen karyawan
- Kontrak kerja
- Status kerja
- Status payroll
- Status absensi
- Riwayat jabatan
- Riwayat mutasi
- Riwayat promosi/demosi
- Riwayat penempatan
- Riwayat gaji
- Riwayat cuti
- Riwayat pelanggaran
- Resign/termination
- Blacklist flag
- Employee import Excel
- Employee export Excel/PDF

## Status Employee

- Draft
- Candidate
- Onboarding
- Active
- Probation
- Suspended
- Resigned
- Terminated
- Blacklisted

---

# 10.6 Client Management — Outsourcing Mode

## Fitur

- Data client
- Legal entity client
- PIC client
- Cabang/lokasi client
- Kontak finance client
- Kontak HR client
- Kontrak kerja sama
- Service agreement
- Rate card client
- SLA
- Manpower request
- Penempatan karyawan
- Invoice client
- Payment history
- Client document
- Client portal user
- Client approval setting
- Client performance report

## Field Client

- Client code
- Client name
- Legal name
- NPWP
- Industry
- Address
- Billing address
- PIC name
- PIC email
- PIC phone
- Finance contact
- HR contact
- Active status
- Contract status
- Credit limit opsional

---

# 10.7 Service Catalog — Outsourcing Mode

## Kategori Layanan

- Security
- Cleaning Service
- Driver
- Office Boy / Office Girl
- Administrasi
- IT Support
- Receptionist
- Customer Service
- Sales Promotion
- Warehouse Staff
- Helper
- Operator Produksi
- Teknisi
- Kurir / Messenger
- Event Staff
- Hospitality Staff
- Custom job category

## Fitur

- Service category
- Service role/position
- Skill requirement
- Certification requirement
- Uniform requirement
- Minimum education
- Minimum experience
- Working schedule
- Rate card
- Payroll component template
- Client billing component
- SLA requirement
- Replacement rule

---

# 10.8 Manpower Request — Outsourcing Mode

## Fitur

- Client membuat permintaan tenaga kerja
- Pilih service category
- Jumlah tenaga kerja
- Lokasi kerja
- Tanggal mulai kerja
- Durasi kontrak
- Shift/jam kerja
- Kualifikasi
- Gender preference opsional
- Usia minimal/maksimal opsional
- Sertifikasi wajib
- Dokumen wajib
- Rate/budget
- Approval client
- Approval outsourcing operator
- Status tracking
- Convert to job requisition
- Assign recruiter
- Link ke kandidat
- Link ke placement
- Request replacement

## Status

- Draft
- Submitted
- Client Approved
- Operator Reviewed
- Need Revision
- In Recruitment
- Partially Fulfilled
- Fulfilled
- Cancelled
- Rejected
- Closed

---

# 10.9 Recruitment & ATS

## Fitur

- Job requisition
- Job vacancy
- Public career page opsional
- Candidate registration
- Upload CV
- Upload KTP
- Upload KK
- Upload Ijazah
- Upload SKCK
- Upload Sertifikat
- Upload SIM untuk driver
- Upload dokumen pendukung
- Candidate screening
- Shortlist
- Interview schedule
- Interview result
- Assessment/test
- Medical check-up
- Background check
- Reference check
- Offering letter
- Candidate approval
- Candidate rejection
- Talent pool
- Blacklist candidate
- Convert candidate to employee
- Onboarding task
- Candidate communication
- Recruitment pipeline dashboard

## Recruitment Pipeline

1. Applied
2. Screening
3. Shortlisted
4. Interview Scheduled
5. Interviewed
6. Assessment
7. MCU
8. Background Check
9. Offering
10. Accepted
11. Rejected
12. Onboarding
13. Hired

---

# 10.10 Contract Management

## Jenis Kontrak

- Kontrak kerja karyawan
- Kontrak kerja sama client
- PKWT
- PKWTT
- Addendum
- Perpanjangan kontrak
- Surat penempatan
- Surat tugas
- SLA agreement
- NDA
- Offering letter
- Exit document

## Fitur

- Template kontrak
- Dynamic placeholder
- Generate PDF
- Upload kontrak
- E-signature integration
- Approval legal
- Contract versioning
- Contract renewal
- Contract expiry reminder
- Contract status
- Contract archive
- Download contract
- Audit log kontrak
- Link kontrak ke employee/client/placement

## Status Kontrak

- Draft
- Waiting Approval
- Approved
- Sent
- Signed
- Active
- Expiring Soon
- Expired
- Renewed
- Terminated
- Cancelled

---

# 10.11 Placement Management — Outsourcing Mode

## Fitur

- Assign employee ke client
- Assign employee ke lokasi kerja
- Assign job position
- Assign supervisor
- Assign shift
- Start date/end date
- Placement contract
- Placement history
- Rotation
- Mutation
- Replacement
- Temporary placement
- Multi-site placement
- Client confirmation
- Site supervisor assignment
- Performance tracking per placement
- Incident tracking per placement

## Status Placement

- Draft
- Waiting Approval
- Active
- On Hold
- Replacement Requested
- Replaced
- Completed
- Cancelled

---

# 10.12 Shift & Schedule

## Fitur

- Master shift
- Shift pagi/siang/malam
- Flexible shift
- Fixed shift
- Rotating shift
- Split shift
- Overnight shift
- Schedule template
- Roster
- Bulk schedule
- Employee schedule
- Team schedule
- Client site schedule
- Shift swap request
- Shift change approval
- Late tolerance
- Early checkout tolerance
- Break time
- Holiday calendar
- Schedule import/export
- Schedule conflict detection

## Field Shift

- Shift name
- Start time
- End time
- Break start
- Break end
- Late tolerance
- Early checkout tolerance
- Minimum working hour
- Overtime eligible
- Overnight flag
- Active status

---

# 10.13 Attendance

## Metode Absensi

- GPS geofence
- Selfie
- Fingerprint integration
- Manual attendance
- Supervisor attendance
- QR location opsional
- Offline attendance sync opsional

## Fitur

- Check-in
- Check-out
- Break-in
- Break-out
- Selfie attendance
- GPS location capture
- Geofence validation
- Attendance photo storage
- Fingerprint sync
- Attendance correction
- Manual attendance request
- Attendance approval
- Late detection
- Early checkout detection
- Absent detection
- Overtime detection
- Attendance anomaly detection
- Fake GPS detection opsional
- Device ID tracking
- IP tracking
- Attendance recap
- Attendance export

## Attendance Status

- Present
- Late
- Early Leave
- Absent
- Leave
- Permission
- Sick
- Holiday
- Day Off
- Overtime
- Pending Correction
- Corrected
- Rejected

## Business Rules

- Karyawan hanya bisa check-in sesuai lokasi yang ditentukan kecuali policy mengizinkan.
- Selfie wajib jika policy mengaktifkan selfie.
- Fingerprint dapat menjadi sumber attendance utama atau pembanding.
- Attendance correction wajib approval.
- Attendance yang sudah masuk payroll tidak boleh diubah tanpa payroll adjustment.

---

# 10.14 Fingerprint Integration

## Fitur

- Register device
- Device location mapping
- Device employee mapping
- Sync employee biometric ID
- Pull attendance logs
- Push employee data ke device opsional
- Device health status
- Last sync status
- Duplicate log handling
- Conflict resolution dengan mobile attendance
- Mapping fingerprint user ID ke employee ID

## Device Fields

- Device code
- Device name
- Brand/model
- IP address
- Port
- Location
- Serial number
- Connection type
- Last sync at
- Active status

---

# 10.15 Leave, Permission & Sick

## Fitur

- Leave type
- Annual leave
- Sick leave
- Special leave
- Unpaid leave
- Maternity/paternity leave
- Permission request
- Half-day leave
- Leave balance
- Leave accrual
- Leave carry forward
- Leave expiration
- Leave approval
- Leave calendar
- Upload attachment
- Leave cancellation
- Leave delegation
- Leave conflict warning
- Team leave visibility

## Status

- Draft
- Submitted
- Waiting Approval
- Approved
- Rejected
- Cancelled

---

# 10.16 Overtime

## Fitur

- Overtime request
- Pre-approved overtime
- Post-approved overtime
- Overtime based on attendance
- Overtime calculation rule
- Overtime approval
- Overtime attachment
- Overtime payroll integration
- Overtime recap
- Overtime export

## Field

- Employee
- Date
- Start time
- End time
- Duration
- Reason
- Attachment
- Approval status
- Payroll status

---

# 10.17 Payroll

## Fitur

- Payroll group
- Payroll period
- Payroll component
- Fixed allowance
- Variable allowance
- Deduction
- Overtime component
- Attendance deduction
- Late deduction
- Absence deduction
- Loan deduction
- Reimbursement payment
- BPJS component configurable
- Tax component configurable
- THR configurable
- Bonus
- Incentive
- Payroll preview
- Payroll run
- Payroll approval
- Payroll lock
- Payroll adjustment
- Payroll disbursement status
- Salary slip PDF
- Salary slip mobile
- Payroll export
- Payroll report
- Payroll journal export opsional

## Payroll Component Types

- Earning
- Deduction
- Benefit
- Tax
- Employer Contribution
- Employee Contribution
- Reimbursement
- Loan
- Adjustment

## Payroll Status

- Draft
- Calculating
- Need Review
- Waiting Approval
- Approved
- Paid
- Locked
- Cancelled

## Business Rules

- Payroll harus mengambil data attendance, overtime, leave, deduction, allowance, reimbursement, loan.
- Payroll yang sudah locked tidak boleh diubah.
- Koreksi setelah locked harus melalui payroll adjustment.
- Slip gaji hanya dapat dilihat employee terkait dan role berwenang.
- Formula payroll harus configurable per tenant/per company/per payroll group.

---

# 10.18 Salary Slip

## Fitur

- Generate slip gaji PDF
- Mobile salary slip
- Download PDF
- Password protected PDF opsional
- Send email salary slip opsional
- Publish/unpublish salary slip
- Salary slip acknowledgment
- Salary slip history

## Isi Slip Gaji

- Nama perusahaan
- Nama karyawan
- Employee ID
- Jabatan
- Departemen
- Periode payroll
- Gaji pokok
- Tunjangan
- Lembur
- Bonus
- Potongan
- BPJS
- Pajak
- Reimbursement
- Total earning
- Total deduction
- Net salary
- Catatan
- Tanggal generate

---

# 10.19 Reimbursement

## Fitur

- Reimbursement type
- Request reimbursement
- Upload receipt
- Approval
- Finance verification
- Payment status
- Link to payroll
- Limit per type
- Limit per employee
- Reimbursement report

## Status

- Draft
- Submitted
- Waiting Approval
- Approved
- Rejected
- Need Revision
- Paid
- Cancelled

---

# 10.20 Loan / Cash Advance

## Fitur

- Employee loan request
- Cash advance
- Installment schedule
- Payroll deduction
- Approval
- Outstanding balance
- Payment history
- Loan report

---

# 10.21 Invoice & Billing — Outsourcing Mode

## Fitur

- Generate invoice ke client
- Invoice based on placement
- Invoice based on payroll
- Invoice based on service fee
- Invoice based on attendance
- Management fee
- Tax component configurable
- Discount
- Penalty
- Additional charge
- Invoice approval
- Send invoice
- Payment tracking
- Payment receipt
- Aging report
- Invoice export PDF
- Invoice item detail
- Link invoice to client contract

## Invoice Status

- Draft
- Waiting Approval
- Approved
- Sent
- Partially Paid
- Paid
- Overdue
- Cancelled
- Void

---

# 10.22 Performance Management

## Fitur

- KPI template
- KPI per role
- KPI per placement
- Performance review
- Supervisor evaluation
- Client evaluation
- Self evaluation
- Peer review opsional
- Score calculation
- Performance notes
- Improvement plan
- Warning letter
- Reward
- Promotion recommendation
- Contract renewal recommendation
- Performance report

## Performance Status

- Draft
- In Review
- Submitted
- Approved
- Published
- Archived

---

# 10.23 Incident & Disciplinary Management

## Fitur

- Incident report
- Violation category
- Warning letter
- Sanction
- Investigation notes
- Attachment evidence
- Supervisor approval
- HR approval
- Client confirmation
- Resolution
- Incident history
- Disciplinary report

---

# 10.24 Asset & Uniform Management

## Fitur

- Asset master
- Uniform master
- Assign asset to employee
- Assign uniform to employee
- Return asset
- Damage report
- Lost asset
- Deduction to payroll opsional
- Asset history
- Stock tracking
- Asset by location/client

---

# 10.25 Training & Certification

## Fitur

- Training catalog
- Training schedule
- Employee enrollment
- Training attendance
- Certification upload
- Certification expiry reminder
- Required certification by service category
- Training result
- Training report

---

# 10.26 Document Management

## Fitur

- Upload document
- Folder/category
- Document type
- Document expiry date
- Versioning
- Preview PDF/image
- Download
- Access permission
- Link to employee/client/contract/candidate
- Document approval
- Document reminder
- Document completeness checklist
- Bulk upload
- Secure URL
- MinIO storage

## Document Type

- KTP
- KK
- NPWP
- BPJS Kesehatan
- BPJS Ketenagakerjaan
- Ijazah
- CV
- SKCK
- SIM
- Sertifikat
- Kontrak kerja
- Kontrak client
- Surat tugas
- Slip gaji
- Invoice
- Receipt
- Foto profil
- Dokumen lain

---

# 10.27 Approval Workflow

## Fitur

- Dynamic workflow
- Approval step
- Sequential approval
- Parallel approval
- Conditional approval
- Amount-based approval
- Department-based approval
- Client-based approval
- Replacement approver
- Delegation approval
- Approval reminder
- Approval escalation
- Approval history
- Approval comment
- Approval attachment

## Modul yang Wajib Mendukung Approval

- Manpower request
- Candidate hiring
- Contract
- Placement
- Attendance correction
- Leave
- Permission
- Overtime
- Reimbursement
- Loan
- Payroll
- Invoice
- Asset lost/damage
- Warning letter
- Performance review

---

# 10.28 Notification System

## Channel

- In-app notification
- Push notification FCM
- Email notification
- WhatsApp gateway opsional
- SMS opsional

## Event Notification

- Login alert
- Approval request
- Approval result
- Attendance reminder
- Late warning
- Leave approval
- Overtime approval
- Payroll published
- Salary slip published
- Invoice sent
- Contract expiring
- Document expiring
- Candidate interview schedule
- Placement start
- Replacement request
- Incident report
- Subscription expiring

---

# 10.29 Reporting & Analytics

## Dashboard Wajib

### Platform Dashboard

- Jumlah tenant
- Tenant aktif
- Subscription status
- Revenue SaaS
- System usage
- Storage usage
- API usage

### Outsourcing Dashboard

- Jumlah client aktif
- Jumlah manpower request
- Jumlah karyawan outsourcing aktif
- Placement aktif
- Attendance today
- Absent today
- Late today
- Payroll bulan ini
- Invoice outstanding
- Contract expiring
- Client performance score

### SaaS HRIS Dashboard

- Jumlah karyawan
- Kehadiran hari ini
- Cuti aktif
- Lembur pending
- Payroll status
- Approval pending
- Turnover
- Department summary
- Birthday/anniversary
- Contract expiring

### Employee Dashboard

- Jadwal hari ini
- Check-in/check-out
- Sisa cuti
- Slip gaji terbaru
- Approval status
- Pengumuman
- Dokumen pribadi
- Request shortcut

## Report List

- Employee report
- Attendance report
- Late report
- Absence report
- Overtime report
- Leave report
- Payroll report
- Salary slip report
- Reimbursement report
- Loan report
- Client report
- Placement report
- Manpower request report
- Recruitment report
- Candidate pipeline report
- Contract report
- Invoice report
- Payment report
- Performance report
- Incident report
- Audit log report

## Export Format

- Excel
- CSV
- PDF

---

# 10.30 Employee Self-Service Mobile

## Fitur

- Login
- Dashboard
- Profile
- Edit limited profile
- View schedule
- Check-in/check-out
- Attendance history
- Request attendance correction
- Request leave
- Request permission
- Request overtime
- Request reimbursement
- View salary slip
- Download salary slip
- View contract
- Upload document
- View announcement
- Notification center
- Approval task untuk supervisor
- Team attendance untuk supervisor
- Incident report untuk supervisor/team leader
- Logout

---

# 10.31 Client Portal

## Fitur

- Dashboard client
- Manpower request
- Tenaga kerja aktif
- Jadwal kerja
- Attendance monitoring
- Performance evaluation
- Replacement request
- Incident report
- Approve overtime opsional
- Approve invoice opsional
- View invoice
- Payment status
- Contract document
- Report download
- User management client

---

# 10.32 SaaS HRIS Company Portal

## Fitur

- Company dashboard
- Employee management
- Organization structure
- Attendance management
- Leave management
- Overtime management
- Payroll
- Reimbursement
- Contract
- Document
- Performance
- Approval
- Report
- Company settings
- User & permission

---

# 10.33 Integration

## Integrasi Wajib/Disiapkan

- Fingerprint device integration
- FCM push notification
- SMTP email
- MinIO object storage
- WhatsApp gateway opsional
- E-signature provider opsional
- Payment gateway opsional
- Accounting system opsional
- Bank disbursement opsional
- SSO OAuth/SAML opsional
- Webhook API
- Public REST API

---

# 10.34 Theme System & Localization / Multi-Language

## Tujuan

Aplikasi KITalent wajib mendukung pengalaman visual dan bahasa yang fleksibel untuk seluruh tenant, role, dan platform. Fitur ini bukan tambahan opsional, melainkan requirement inti karena aplikasi akan digunakan oleh client outsourcing, perusahaan SaaS HRIS, admin, supervisor, karyawan, dan candidate dari berbagai latar belakang.

## Requirement Theme Light/Dark

1. Aplikasi wajib memiliki **Light Mode** dan **Dark Mode** pada web Next.js dan mobile Flutter.
2. User dapat memilih theme dari:
   - `system` — mengikuti pengaturan perangkat/browser.
   - `light` — selalu menggunakan Light Mode.
   - `dark` — selalu menggunakan Dark Mode.
3. Default theme untuk user baru adalah `system`, tetapi tenant dapat menentukan default theme melalui tenant settings.
4. Theme harus konsisten pada:
   - Login page
   - Dashboard
   - Sidebar/header/bottom navigation
   - Semua form
   - Data table
   - Approval timeline
   - Calendar/shift roster
   - Payroll page
   - Salary slip page
   - Invoice page
   - Report page
   - Notification page
   - Mobile attendance
- Mobile language switch
- Mobile theme switch screen
   - Mobile employee self-service
5. Semua warna wajib menggunakan design token, bukan warna hardcoded di component.
6. Komponen harus tetap terbaca di Light Mode dan Dark Mode, terutama:
   - Text primary/secondary
   - Border
   - Card
   - Table row
   - Badge status
   - Error/warning/success/info state
   - Disabled state
   - Chart color
   - Empty state
7. Theme preference wajib disimpan di:
   - Local storage/browser preference untuk web.
   - Secure/local storage untuk Flutter.
   - Backend `user_preferences` saat user login.
8. Saat user login di device baru, backend mengirim preference terakhir user.
9. Jika user belum memiliki preference, gunakan default tenant. Jika tenant belum memiliki default, gunakan `system`.

## Requirement Bahasa Indonesia & English

1. Aplikasi wajib mendukung minimal dua locale:
   - `id-ID` — Bahasa Indonesia, default utama.
   - `en-US` — English.
2. User dapat mengganti bahasa dari:
   - Login page
   - Profile menu
   - User settings
   - Mobile settings
3. Locale preference wajib disimpan di:
   - Cookie/local storage untuk web.
   - Local storage untuk mobile.
   - Backend `user_preferences` saat user login.
4. Semua text UI wajib memakai translation key, termasuk:
   - Menu sidebar
   - Page title
   - Button
   - Placeholder
   - Table header
   - Filter label
   - Form label
   - Validation message
   - Empty state
   - Error state
   - Success toast
   - Confirmation dialog
   - Notification title/body
   - Approval status
   - Payroll label
   - Invoice label
   - Attendance status
   - Report label
5. Dilarang menulis text langsung di component seperti `Simpan`, `Submit`, `Karyawan`, `Payroll`, `Save`, atau `Employee`. Semua harus melalui translation key.
6. Format tanggal, waktu, angka, mata uang, dan persentase wajib mengikuti locale:
   - `id-ID`: `31 Mei 2026`, `Rp10.000.000`, koma desimal Indonesia.
   - `en-US`: `May 31, 2026`, `IDR 10,000,000`, format English.
7. Dokumen sistem yang dapat digenerate seperti salary slip, invoice, kontrak template, email template, dan notifikasi harus memiliki versi bahasa jika diperlukan.
8. Tenant dapat menentukan default language, tetapi user tetap dapat override di preference pribadi.
9. Backend wajib menerima header `Accept-Language` dan mengembalikan error/validation message sesuai locale jika memungkinkan.
10. Translation key harus stabil agar bisa dipakai linting, QA, dan future language expansion.

## Translation Namespace Wajib

```txt
common.*
auth.*
navigation.*
dashboard.*
tenant.*
company.*
organization.*
employee.*
client.*
outsourcing.*
recruitment.*
candidate.*
contract.*
placement.*
schedule.*
attendance.*
leave.*
overtime.*
payroll.*
salarySlip.*
invoice.*
reimbursement.*
loan.*
approval.*
notification.*
document.*
performance.*
incident.*
report.*
settings.*
validation.*
error.*
success.*
emptyState.*
```

## Contoh Translation Key

```json
{
  "common.save": {
    "id-ID": "Simpan",
    "en-US": "Save"
  },
  "attendance.checkIn": {
    "id-ID": "Absen Masuk",
    "en-US": "Check In"
  },
  "payroll.salarySlip": {
    "id-ID": "Slip Gaji",
    "en-US": "Salary Slip"
  },
  "settings.appearance": {
    "id-ID": "Tampilan",
    "en-US": "Appearance"
  },
  "settings.language": {
    "id-ID": "Bahasa",
    "en-US": "Language"
  }
}
```

---

## 11. ARSITEKTUR TEKNOLOGI

## 11.1 Stack Utama

### Backend

- NestJS
- TypeScript
- Node.js
- PostgreSQL
- Redis
- MinIO
- Prisma ORM atau TypeORM
- JWT Authentication
- Swagger/OpenAPI
- BullMQ untuk queue/job
- Docker

### Frontend Web

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- next-themes untuk Light/Dark Mode
- next-intl atau next-i18next untuk multi-language
- React Hook Form
- Zod
- TanStack Query
- Zustand/Jotai opsional
- Recharts untuk dashboard
- Axios/fetch API client

### Mobile

- Flutter
- Dart
- Riverpod/Bloc sebagai state management
- GoRouter
- Dio HTTP client
- Secure Storage
- Firebase Cloud Messaging
- Camera
- Geolocator
- Local notification
- PDF viewer
- Image picker
- Biometric local auth opsional
- intl/easy_localization untuk multi-language
- ThemeMode system/light/dark untuk Light/Dark Mode

### Infrastructure

- VPS/Cloud Server
- Docker Compose
- Nginx Reverse Proxy
- PostgreSQL
- Redis
- MinIO
- SSL/TLS
- CI/CD
- Backup scheduler
- Monitoring
- Log management

---

## 11.2 High-Level Architecture

```txt
[Flutter Mobile App] ----\
                         \
[Next.js Web Portal] ------> [Nginx/API Gateway] -> [NestJS Backend API]
                         /                         |
[External Integrations] -                          |
                                                   |
                                                   +--> PostgreSQL
                                                   +--> Redis
                                                   +--> MinIO
                                                   +--> Queue Worker
                                                   +--> FCM/Email/WhatsApp
```

---

## 12. STRUKTUR FOLDER MONOREPO

Gunakan monorepo agar backend, web, mobile, package shared, dan deployment mudah dikelola.

```txt
kitalent/
├── README.md
├── PRD.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .gitignore
├── .env.example
├── docker-compose.yml
├── docker-compose.prod.yml
├── nginx/
│   ├── nginx.conf
│   └── sites/
│       ├── api.conf
│       ├── web.conf
│       └── minio.conf
├── infra/
│   ├── docker/
│   │   ├── backend.Dockerfile
│   │   ├── web.Dockerfile
│   │   └── worker.Dockerfile
│   ├── scripts/
│   │   ├── backup-db.sh
│   │   ├── restore-db.sh
│   │   ├── deploy.sh
│   │   └── migrate.sh
│   └── monitoring/
│       ├── prometheus.yml
│       └── grafana-dashboard.json
├── apps/
│   ├── api/
│   ├── web/
│   └── mobile/
├── packages/
│   ├── shared/
│   ├── ui/
│   ├── design-tokens/
│   ├── i18n/
│   ├── config/
│   ├── eslint-config/
│   └── types/
└── docs/
    ├── api.md
    ├── database.md
    ├── deployment.md
    ├── security.md
    ├── user-flow.md
    ├── theme-guideline.md
    ├── i18n-guideline.md
    └── testing.md
```

---

## 13. STRUKTUR FOLDER BACKEND NESTJS

```txt
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── constants/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── enums/
│   │   ├── exceptions/
│   │   ├── filters/
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── permission.guard.ts
│   │   │   └── tenant.guard.ts
│   │   ├── interceptors/
│   │   ├── middleware/
│   │   ├── pipes/
│   │   ├── utils/
│   │   └── validators/
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── minio.config.ts
│   │   ├── jwt.config.ts
│   │   ├── mail.config.ts
│   │   └── fcm.config.ts
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── seeds/
│   ├── modules/
│   │   ├── auth/
│   │   ├── tenancy/
│   │   ├── subscriptions/
│   │   ├── rbac/
│   │   ├── users/
│   │   ├── companies/
│   │   ├── organization/
│   │   ├── employees/
│   │   ├── clients/
│   │   ├── services/
│   │   ├── manpower-requests/
│   │   ├── recruitment/
│   │   ├── contracts/
│   │   ├── placements/
│   │   ├── schedules/
│   │   ├── attendance/
│   │   ├── biometric/
│   │   ├── leave/
│   │   ├── overtime/
│   │   ├── payroll/
│   │   ├── reimbursements/
│   │   ├── loans/
│   │   ├── invoices/
│   │   ├── performance/
│   │   ├── incidents/
│   │   ├── assets/
│   │   ├── training/
│   │   ├── documents/
│   │   ├── approvals/
│   │   ├── notifications/
│   │   ├── reports/
│   │   ├── integrations/
│   │   ├── localization/
│   │   ├── appearance/
│   │   ├── audit-logs/
│   │   └── settings/
│   ├── jobs/
│   │   ├── queues.module.ts
│   │   ├── processors/
│   │   │   ├── notification.processor.ts
│   │   │   ├── payroll.processor.ts
│   │   │   ├── report.processor.ts
│   │   │   └── biometric-sync.processor.ts
│   │   └── schedules/
│   └── storage/
│       ├── minio.service.ts
│       └── file-url.service.ts
├── test/
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## 14. STRUKTUR MODUL BACKEND

Setiap modul NestJS wajib mengikuti struktur:

```txt
module-name/
├── module-name.module.ts
├── module-name.controller.ts
├── module-name.service.ts
├── dto/
│   ├── create-module-name.dto.ts
│   ├── update-module-name.dto.ts
│   ├── query-module-name.dto.ts
│   └── response-module-name.dto.ts
├── entities/ atau repository/
├── enums/
├── guards/
├── policies/
├── tests/
└── index.ts
```

Untuk modul besar seperti payroll/recruitment gunakan subfolder:

```txt
payroll/
├── payroll.module.ts
├── payroll-runs/
├── payroll-components/
├── payroll-periods/
├── salary-slips/
├── payroll-adjustments/
├── payroll-reports/
└── payroll-calculator/
```

---

## 15. STRUKTUR FOLDER WEB NEXT.JS

```txt
apps/web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── forgot-password/
│   ├── reset-password/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── platform/
│   │   ├── tenants/
│   │   ├── subscriptions/
│   │   ├── billing/
│   │   └── audit/
│   ├── outsourcing/
│   │   ├── clients/
│   │   ├── services/
│   │   ├── manpower-requests/
│   │   ├── recruitment/
│   │   ├── candidates/
│   │   ├── contracts/
│   │   ├── placements/
│   │   ├── schedules/
│   │   ├── attendance/
│   │   ├── payroll/
│   │   ├── invoices/
│   │   ├── performance/
│   │   └── reports/
│   ├── hris/
│   │   ├── company/
│   │   ├── organization/
│   │   ├── employees/
│   │   ├── attendance/
│   │   ├── leave/
│   │   ├── overtime/
│   │   ├── payroll/
│   │   ├── reimbursement/
│   │   ├── loans/
│   │   ├── performance/
│   │   ├── documents/
│   │   └── reports/
│   ├── client-portal/
│   │   ├── dashboard/
│   │   ├── manpower-requests/
│   │   ├── workers/
│   │   ├── attendance/
│   │   ├── invoices/
│   │   └── reports/
│   ├── approvals/
│   ├── notifications/
│   ├── settings/
│   │   ├── appearance/
│   │   └── language/
│   └── profile/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   ├── tables/
│   ├── charts/
│   ├── modals/
│   ├── dashboards/
│   ├── upload/
│   ├── approval/
│   ├── theme-toggle/
│   ├── language-switcher/
│   └── shared/
├── config/
├── constants/
├── hooks/
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   ├── permissions.ts
│   ├── query-client.ts
│   ├── i18n.ts
│   ├── theme.ts
│   └── utils.ts
├── services/
│   ├── auth.service.ts
│   ├── employee.service.ts
│   ├── attendance.service.ts
│   ├── payroll.service.ts
│   └── index.ts
├── stores/
├── types/
├── validations/
├── messages/
│   ├── id-ID.json
│   └── en-US.json
├── public/
│   ├── logo/
│   └── images/
├── middleware.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## 16. STRUKTUR FOLDER MOBILE FLUTTER

```txt
apps/mobile/
├── android/
├── ios/
├── assets/
│   ├── images/
│   ├── icons/
│   ├── fonts/
│   └── sounds/
├── lib/
│   ├── main.dart
│   ├── app.dart
│   ├── core/
│   │   ├── constants/
│   │   ├── config/
│   │   ├── errors/
│   │   ├── network/
│   │   │   ├── api_client.dart
│   │   │   ├── dio_interceptor.dart
│   │   │   └── endpoints.dart
│   │   ├── storage/
│   │   ├── theme/
│   │   ├── localization/
│   │   ├── routing/
│   │   ├── permissions/
│   │   ├── utils/
│   │   └── widgets/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   └── presentation/
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── attendance/
│   │   ├── schedule/
│   │   ├── leave/
│   │   ├── overtime/
│   │   ├── reimbursement/
│   │   ├── payroll/
│   │   ├── salary_slip/
│   │   ├── approvals/
│   │   ├── notifications/
│   │   ├── documents/
│   │   ├── performance/
│   │   ├── incident/
│   │   ├── client_portal/
│   │   └── settings/
│   │       ├── appearance/
│   │       └── language/
│   └── shared/
│       ├── models/
│       ├── providers/
│       ├── widgets/
│       ├── localization/
│       └── extensions/
├── test/
├── pubspec.yaml
└── analysis_options.yaml
```

---

## 17. DATABASE DESIGN

## 17.1 Prinsip Database

1. Gunakan PostgreSQL.
2. Semua primary key menggunakan UUID.
3. Semua tabel tenant-specific harus memiliki `tenant_id`.
4. Gunakan soft delete.
5. Gunakan index untuk foreign key, search field, status, created_at.
6. Gunakan constraint untuk menjaga integritas data.
7. Data payroll, salary, dokumen identitas harus dibatasi aksesnya.
8. Simpan file metadata di database, file fisik di MinIO.
9. Semua status dibuat enum di aplikasi dan/atau lookup table jika configurable.
10. Theme, language, tenant branding, dan user preference wajib disimpan di database agar konsisten di semua device.
11. Translation key dan template bilingual harus bisa dikelola tanpa mengubah source code jika diperlukan untuk enterprise.

---

## 17.2 Core Tables

### tenants

```sql
id uuid pk
code varchar unique
name varchar
legal_name varchar
mode varchar -- outsourcing, hris, hybrid
email varchar
phone varchar
address text
tax_number varchar
logo_file_id uuid nullable
status varchar -- active, inactive, suspended, trial
created_at timestamp
updated_at timestamp
deleted_at timestamp nullable
created_by uuid nullable
updated_by uuid nullable
deleted_by uuid nullable
```

### tenant_subscriptions

```sql
id uuid pk
tenant_id uuid fk tenants.id
plan_id uuid fk subscription_plans.id
start_date date
end_date date
trial_end_date date nullable
billing_cycle varchar -- monthly, yearly, custom
employee_limit int
storage_limit_mb int
status varchar -- trial, active, overdue, cancelled, expired
created_at timestamp
updated_at timestamp
```

### subscription_plans

```sql
id uuid pk
name varchar
code varchar unique
description text
price_monthly numeric
price_yearly numeric
employee_limit int
storage_limit_mb int
is_active boolean
created_at timestamp
updated_at timestamp
```

### plan_features

```sql
id uuid pk
plan_id uuid fk subscription_plans.id
feature_code varchar
feature_name varchar
is_enabled boolean
limit_value int nullable
created_at timestamp
updated_at timestamp
```

---

## 17.3 RBAC Tables

### users

```sql
id uuid pk
tenant_id uuid nullable fk tenants.id
email varchar
phone varchar nullable
password_hash varchar
full_name varchar
avatar_file_id uuid nullable
preferred_locale varchar default 'id-ID' -- id-ID, en-US
preferred_theme varchar default 'system' -- system, light, dark
status varchar -- active, inactive, suspended, invited
last_login_at timestamp nullable
email_verified_at timestamp nullable
phone_verified_at timestamp nullable
created_at timestamp
updated_at timestamp
deleted_at timestamp nullable
```

### roles

```sql
id uuid pk
tenant_id uuid nullable fk tenants.id
name varchar
code varchar
description text
is_system_role boolean
created_at timestamp
updated_at timestamp
deleted_at timestamp nullable
```

### permissions

```sql
id uuid pk
module varchar
action varchar
scope varchar
code varchar unique
description text
created_at timestamp
updated_at timestamp
```

### role_permissions

```sql
id uuid pk
role_id uuid fk roles.id
permission_id uuid fk permissions.id
created_at timestamp
```

### user_roles

```sql
id uuid pk
user_id uuid fk users.id
role_id uuid fk roles.id
tenant_id uuid nullable fk tenants.id
company_id uuid nullable
client_id uuid nullable
created_at timestamp
```

### refresh_tokens

```sql
id uuid pk
user_id uuid fk users.id
token_hash varchar
device_id varchar nullable
ip_address varchar nullable
user_agent text nullable
expires_at timestamp
revoked_at timestamp nullable
created_at timestamp
```

### login_histories

```sql
id uuid pk
user_id uuid fk users.id
tenant_id uuid nullable
ip_address varchar
user_agent text
device_id varchar nullable
status varchar -- success, failed
failure_reason text nullable
created_at timestamp
```

### user_preferences

```sql
id uuid pk
user_id uuid fk users.id
tenant_id uuid nullable fk tenants.id
locale varchar default 'id-ID' -- id-ID, en-US
theme varchar default 'system' -- system, light, dark
timezone varchar default 'Asia/Makassar'
date_format varchar nullable
time_format varchar nullable -- 12h, 24h
currency varchar default 'IDR'
notification_preferences jsonb nullable
metadata jsonb nullable
created_at timestamp
updated_at timestamp
```

### tenant_appearance_settings

```sql
id uuid pk
tenant_id uuid fk tenants.id
default_theme varchar default 'system' -- system, light, dark
primary_color varchar nullable
secondary_color varchar nullable
accent_color varchar nullable
logo_light_file_id uuid nullable fk files.id
logo_dark_file_id uuid nullable fk files.id
favicon_file_id uuid nullable fk files.id
login_background_file_id uuid nullable fk files.id
custom_css text nullable
created_at timestamp
updated_at timestamp
```

### tenant_localization_settings

```sql
id uuid pk
tenant_id uuid fk tenants.id
default_locale varchar default 'id-ID'
enabled_locales text[] default array['id-ID','en-US']
fallback_locale varchar default 'id-ID'
timezone varchar default 'Asia/Makassar'
currency varchar default 'IDR'
created_at timestamp
updated_at timestamp
```

### translation_keys

```sql
id uuid pk
namespace varchar -- common, auth, attendance, payroll, etc
key varchar -- common.save, attendance.checkIn
description text nullable
is_system boolean default true
created_at timestamp
updated_at timestamp
unique(namespace, key)
```

### translations

```sql
id uuid pk
translation_key_id uuid fk translation_keys.id
tenant_id uuid nullable fk tenants.id -- null = system default, filled = tenant override
locale varchar -- id-ID, en-US
value text
created_at timestamp
updated_at timestamp
unique(translation_key_id, tenant_id, locale)
```

---

## 17.4 Company & Organization Tables

### companies

```sql
id uuid pk
tenant_id uuid fk tenants.id
code varchar
name varchar
legal_name varchar
tax_number varchar nullable
email varchar nullable
phone varchar nullable
address text nullable
logo_file_id uuid nullable
status varchar
created_at timestamp
updated_at timestamp
deleted_at timestamp nullable
```

### branches

```sql
id uuid pk
tenant_id uuid fk tenants.id
company_id uuid fk companies.id
code varchar
name varchar
address text
phone varchar nullable
status varchar
created_at timestamp
updated_at timestamp
deleted_at timestamp nullable
```

### work_locations

```sql
id uuid pk
tenant_id uuid fk tenants.id
company_id uuid nullable fk companies.id
client_id uuid nullable
branch_id uuid nullable fk branches.id
code varchar
name varchar
address text
latitude numeric
longitude numeric
radius_meter int
status varchar
created_at timestamp
updated_at timestamp
deleted_at timestamp nullable
```

### departments

```sql
id uuid pk
tenant_id uuid fk tenants.id
company_id uuid fk companies.id
parent_id uuid nullable fk departments.id
code varchar
name varchar
description text nullable
status varchar
created_at timestamp
updated_at timestamp
deleted_at timestamp nullable
```

### positions

```sql
id uuid pk
tenant_id uuid fk tenants.id
company_id uuid fk companies.id
department_id uuid nullable fk departments.id
code varchar
name varchar
level_id uuid nullable
description text nullable
status varchar
created_at timestamp
updated_at timestamp
deleted_at timestamp nullable
```

### job_levels

```sql
id uuid pk
tenant_id uuid fk tenants.id
company_id uuid fk companies.id
code varchar
name varchar
rank int
description text nullable
created_at timestamp
updated_at timestamp
```

---

## 17.5 Employee Tables

### employees

```sql
id uuid pk
tenant_id uuid fk tenants.id
company_id uuid nullable fk companies.id
user_id uuid nullable fk users.id
employee_number varchar
full_name varchar
preferred_name varchar nullable
gender varchar nullable
birth_place varchar nullable
birth_date date nullable
marital_status varchar nullable
religion varchar nullable
nationality varchar nullable
identity_number varchar nullable
tax_number varchar nullable
phone varchar nullable
email varchar nullable
address text nullable
photo_file_id uuid nullable
department_id uuid nullable fk departments.id
position_id uuid nullable fk positions.id
job_level_id uuid nullable fk job_levels.id
supervisor_id uuid nullable fk employees.id
employment_type varchar -- permanent, contract, outsourcing, daily, internship
employment_status varchar -- candidate, onboarding, active, probation, suspended, resigned, terminated, blacklisted
join_date date nullable
end_date date nullable
resign_date date nullable
payroll_group_id uuid nullable
attendance_policy_id uuid nullable
leave_policy_id uuid nullable
created_at timestamp
updated_at timestamp
deleted_at timestamp nullable
```

### employee_contacts

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid fk employees.id
type varchar -- personal, emergency, family
name varchar
relationship varchar nullable
phone varchar
email varchar nullable
address text nullable
created_at timestamp
updated_at timestamp
```

### employee_bank_accounts

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid fk employees.id
bank_name varchar
account_number varchar
account_holder_name varchar
is_primary boolean
created_at timestamp
updated_at timestamp
```

### employee_documents

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid fk employees.id
document_type varchar
file_id uuid fk files.id
document_number varchar nullable
issued_date date nullable
expired_date date nullable
status varchar -- valid, expired, pending, rejected
created_at timestamp
updated_at timestamp
```

### employee_contracts

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid fk employees.id
contract_type varchar
contract_number varchar
start_date date
end_date date nullable
file_id uuid nullable fk files.id
status varchar
created_at timestamp
updated_at timestamp
```

### employee_position_histories

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid fk employees.id
old_position_id uuid nullable
new_position_id uuid nullable
old_department_id uuid nullable
new_department_id uuid nullable
effective_date date
reason text nullable
created_at timestamp
```

---

## 17.6 Client & Outsourcing Tables

### clients

```sql
id uuid pk
tenant_id uuid fk tenants.id
code varchar
name varchar
legal_name varchar
industry varchar nullable
tax_number varchar nullable
email varchar nullable
phone varchar nullable
address text nullable
billing_address text nullable
status varchar -- active, inactive, suspended
created_at timestamp
updated_at timestamp
deleted_at timestamp nullable
```

### client_contacts

```sql
id uuid pk
tenant_id uuid fk tenants.id
client_id uuid fk clients.id
name varchar
position varchar nullable
email varchar nullable
phone varchar nullable
type varchar -- owner, hr, finance, operation
is_primary boolean
created_at timestamp
updated_at timestamp
```

### client_contracts

```sql
id uuid pk
tenant_id uuid fk tenants.id
client_id uuid fk clients.id
contract_number varchar
title varchar
start_date date
end_date date
billing_type varchar
service_fee_type varchar
file_id uuid nullable fk files.id
status varchar
created_at timestamp
updated_at timestamp
```

### service_categories

```sql
id uuid pk
tenant_id uuid fk tenants.id
code varchar
name varchar
description text nullable
status varchar
created_at timestamp
updated_at timestamp
```

### service_positions

```sql
id uuid pk
tenant_id uuid fk tenants.id
service_category_id uuid fk service_categories.id
code varchar
name varchar
description text nullable
minimum_education varchar nullable
minimum_experience varchar nullable
required_certification text nullable
status varchar
created_at timestamp
updated_at timestamp
```

### client_rate_cards

```sql
id uuid pk
tenant_id uuid fk tenants.id
client_id uuid fk clients.id
service_position_id uuid fk service_positions.id
base_salary numeric
allowance numeric
management_fee numeric
billing_rate numeric
currency varchar default 'IDR'
effective_start date
effective_end date nullable
status varchar
created_at timestamp
updated_at timestamp
```

### manpower_requests

```sql
id uuid pk
tenant_id uuid fk tenants.id
client_id uuid fk clients.id
request_number varchar
title varchar
description text nullable
requested_by uuid fk users.id
needed_date date
status varchar
created_at timestamp
updated_at timestamp
deleted_at timestamp nullable
```

### manpower_request_items

```sql
id uuid pk
tenant_id uuid fk tenants.id
manpower_request_id uuid fk manpower_requests.id
service_position_id uuid fk service_positions.id
quantity int
work_location_id uuid nullable fk work_locations.id
shift_id uuid nullable
start_date date
end_date date nullable
qualification text nullable
notes text nullable
status varchar
created_at timestamp
updated_at timestamp
```

---

## 17.7 Recruitment Tables

### job_requisitions

```sql
id uuid pk
tenant_id uuid fk tenants.id
manpower_request_id uuid nullable fk manpower_requests.id
company_id uuid nullable fk companies.id
client_id uuid nullable fk clients.id
title varchar
description text
quantity int
status varchar
created_at timestamp
updated_at timestamp
```

### vacancies

```sql
id uuid pk
tenant_id uuid fk tenants.id
job_requisition_id uuid fk job_requisitions.id
title varchar
description text
requirements text
is_public boolean
published_at timestamp nullable
closed_at timestamp nullable
status varchar
created_at timestamp
updated_at timestamp
```

### candidates

```sql
id uuid pk
tenant_id uuid fk tenants.id
full_name varchar
email varchar nullable
phone varchar nullable
gender varchar nullable
birth_date date nullable
identity_number varchar nullable
address text nullable
source varchar nullable
status varchar
blacklist_reason text nullable
created_at timestamp
updated_at timestamp
deleted_at timestamp nullable
```

### candidate_applications

```sql
id uuid pk
tenant_id uuid fk tenants.id
candidate_id uuid fk candidates.id
vacancy_id uuid fk vacancies.id
pipeline_status varchar
applied_at timestamp
current_stage varchar
score numeric nullable
notes text nullable
created_at timestamp
updated_at timestamp
```

### candidate_documents

```sql
id uuid pk
tenant_id uuid fk tenants.id
candidate_id uuid fk candidates.id
document_type varchar
file_id uuid fk files.id
status varchar
created_at timestamp
updated_at timestamp
```

### interview_schedules

```sql
id uuid pk
tenant_id uuid fk tenants.id
candidate_application_id uuid fk candidate_applications.id
interviewer_id uuid nullable fk users.id
scheduled_at timestamp
location varchar nullable
meeting_link varchar nullable
status varchar
created_at timestamp
updated_at timestamp
```

### interview_results

```sql
id uuid pk
tenant_id uuid fk tenants.id
interview_schedule_id uuid fk interview_schedules.id
score numeric nullable
result varchar -- passed, failed, consideration
notes text nullable
created_at timestamp
updated_at timestamp
```

### candidate_offers

```sql
id uuid pk
tenant_id uuid fk tenants.id
candidate_application_id uuid fk candidate_applications.id
offered_salary numeric nullable
start_date date nullable
file_id uuid nullable
status varchar
created_at timestamp
updated_at timestamp
```

### onboarding_tasks

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid nullable fk employees.id
candidate_id uuid nullable fk candidates.id
title varchar
description text nullable
due_date date nullable
status varchar
created_at timestamp
updated_at timestamp
```

---

## 17.8 Placement Tables

### placements

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid fk employees.id
client_id uuid fk clients.id
manpower_request_item_id uuid nullable fk manpower_request_items.id
service_position_id uuid nullable fk service_positions.id
work_location_id uuid nullable fk work_locations.id
supervisor_id uuid nullable fk employees.id
client_supervisor_user_id uuid nullable fk users.id
start_date date
end_date date nullable
status varchar
created_at timestamp
updated_at timestamp
deleted_at timestamp nullable
```

### placement_histories

```sql
id uuid pk
tenant_id uuid fk tenants.id
placement_id uuid fk placements.id
employee_id uuid fk employees.id
old_client_id uuid nullable
new_client_id uuid nullable
old_location_id uuid nullable
new_location_id uuid nullable
effective_date date
type varchar -- rotation, mutation, replacement, extension
reason text nullable
created_at timestamp
```

### replacement_requests

```sql
id uuid pk
tenant_id uuid fk tenants.id
placement_id uuid fk placements.id
requested_by uuid fk users.id
reason text
requested_date date
target_replacement_date date nullable
status varchar
created_at timestamp
updated_at timestamp
```

---

## 17.9 Schedule & Attendance Tables

### shifts

```sql
id uuid pk
tenant_id uuid fk tenants.id
company_id uuid nullable fk companies.id
client_id uuid nullable fk clients.id
code varchar
name varchar
start_time time
end_time time
break_start time nullable
break_end time nullable
late_tolerance_minutes int
early_checkout_tolerance_minutes int
is_overnight boolean
status varchar
created_at timestamp
updated_at timestamp
```

### work_schedules

```sql
id uuid pk
tenant_id uuid fk tenants.id
name varchar
description text nullable
schedule_type varchar -- fixed, rotating, flexible
status varchar
created_at timestamp
updated_at timestamp
```

### employee_schedules

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid fk employees.id
shift_id uuid fk shifts.id
work_location_id uuid nullable fk work_locations.id
schedule_date date
status varchar
created_at timestamp
updated_at timestamp
```

### attendance_policies

```sql
id uuid pk
tenant_id uuid fk tenants.id
name varchar
require_gps boolean
require_selfie boolean
allow_outside_geofence boolean
allow_attendance_correction boolean
allow_offline_attendance boolean
late_tolerance_minutes int
early_checkout_tolerance_minutes int
status varchar
created_at timestamp
updated_at timestamp
```

### attendances

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid fk employees.id
employee_schedule_id uuid nullable fk employee_schedules.id
attendance_date date
check_in_at timestamp nullable
check_out_at timestamp nullable
check_in_latitude numeric nullable
check_in_longitude numeric nullable
check_out_latitude numeric nullable
check_out_longitude numeric nullable
check_in_file_id uuid nullable fk files.id
check_out_file_id uuid nullable fk files.id
source varchar -- mobile, fingerprint, manual, supervisor
device_id varchar nullable
status varchar
late_minutes int default 0
early_checkout_minutes int default 0
working_minutes int default 0
notes text nullable
created_at timestamp
updated_at timestamp
```

### attendance_corrections

```sql
id uuid pk
tenant_id uuid fk tenants.id
attendance_id uuid fk attendances.id
employee_id uuid fk employees.id
requested_check_in_at timestamp nullable
requested_check_out_at timestamp nullable
reason text
attachment_file_id uuid nullable
status varchar
created_at timestamp
updated_at timestamp
```

### biometric_devices

```sql
id uuid pk
tenant_id uuid fk tenants.id
code varchar
name varchar
brand varchar nullable
model varchar nullable
serial_number varchar nullable
ip_address varchar nullable
port int nullable
work_location_id uuid nullable fk work_locations.id
status varchar
last_sync_at timestamp nullable
created_at timestamp
updated_at timestamp
```

### biometric_logs

```sql
id uuid pk
tenant_id uuid fk tenants.id
biometric_device_id uuid fk biometric_devices.id
employee_id uuid nullable fk employees.id
biometric_user_id varchar
log_time timestamp
log_type varchar
raw_payload jsonb
sync_status varchar
created_at timestamp
```

---

## 17.10 Leave & Overtime Tables

### leave_types

```sql
id uuid pk
tenant_id uuid fk tenants.id
code varchar
name varchar
is_paid boolean
requires_attachment boolean
annual_quota int nullable
status varchar
created_at timestamp
updated_at timestamp
```

### leave_balances

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid fk employees.id
leave_type_id uuid fk leave_types.id
year int
opening_balance numeric
earned numeric
used numeric
remaining numeric
expired numeric
created_at timestamp
updated_at timestamp
```

### leave_requests

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid fk employees.id
leave_type_id uuid fk leave_types.id
start_date date
end_date date
total_days numeric
reason text
attachment_file_id uuid nullable
status varchar
created_at timestamp
updated_at timestamp
```

### permission_requests

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid fk employees.id
permission_date date
start_time time nullable
end_time time nullable
reason text
attachment_file_id uuid nullable
status varchar
created_at timestamp
updated_at timestamp
```

### overtime_requests

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid fk employees.id
overtime_date date
start_time time
end_time time
duration_minutes int
reason text
attachment_file_id uuid nullable
status varchar
payroll_status varchar
created_at timestamp
updated_at timestamp
```

---

## 17.11 Payroll Tables

### payroll_groups

```sql
id uuid pk
tenant_id uuid fk tenants.id
company_id uuid nullable fk companies.id
name varchar
description text nullable
payment_schedule varchar
status varchar
created_at timestamp
updated_at timestamp
```

### payroll_components

```sql
id uuid pk
tenant_id uuid fk tenants.id
code varchar
name varchar
type varchar -- earning, deduction, benefit, tax, reimbursement, loan, adjustment
calculation_type varchar -- fixed, formula, attendance_based, manual
formula text nullable
is_taxable boolean
is_active boolean
created_at timestamp
updated_at timestamp
```

### employee_payroll_components

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid fk employees.id
payroll_component_id uuid fk payroll_components.id
amount numeric nullable
formula_override text nullable
effective_start date
effective_end date nullable
status varchar
created_at timestamp
updated_at timestamp
```

### payroll_periods

```sql
id uuid pk
tenant_id uuid fk tenants.id
payroll_group_id uuid fk payroll_groups.id
name varchar
start_date date
end_date date
payment_date date nullable
status varchar
created_at timestamp
updated_at timestamp
```

### payroll_runs

```sql
id uuid pk
tenant_id uuid fk tenants.id
payroll_period_id uuid fk payroll_periods.id
run_number varchar
processed_by uuid nullable fk users.id
approved_by uuid nullable fk users.id
status varchar
gross_total numeric
deduction_total numeric
net_total numeric
processed_at timestamp nullable
approved_at timestamp nullable
created_at timestamp
updated_at timestamp
```

### payroll_run_items

```sql
id uuid pk
tenant_id uuid fk tenants.id
payroll_run_id uuid fk payroll_runs.id
employee_id uuid fk employees.id
gross_amount numeric
deduction_amount numeric
net_amount numeric
status varchar
created_at timestamp
updated_at timestamp
```

### payroll_item_details

```sql
id uuid pk
tenant_id uuid fk tenants.id
payroll_run_item_id uuid fk payroll_run_items.id
payroll_component_id uuid fk payroll_components.id
component_name varchar
component_type varchar
amount numeric
notes text nullable
created_at timestamp
```

### salary_slips

```sql
id uuid pk
tenant_id uuid fk tenants.id
payroll_run_item_id uuid fk payroll_run_items.id
employee_id uuid fk employees.id
file_id uuid nullable fk files.id
published_at timestamp nullable
downloaded_at timestamp nullable
status varchar
created_at timestamp
updated_at timestamp
```

---

## 17.12 Reimbursement & Loan Tables

### reimbursement_types

```sql
id uuid pk
tenant_id uuid fk tenants.id
code varchar
name varchar
max_amount numeric nullable
requires_receipt boolean
status varchar
created_at timestamp
updated_at timestamp
```

### reimbursement_requests

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid fk employees.id
reimbursement_type_id uuid fk reimbursement_types.id
amount numeric
request_date date
description text
receipt_file_id uuid nullable
status varchar
payment_status varchar
created_at timestamp
updated_at timestamp
```

### loan_requests

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid fk employees.id
amount numeric
installment_count int
monthly_deduction numeric
reason text
status varchar
created_at timestamp
updated_at timestamp
```

### loan_installments

```sql
id uuid pk
tenant_id uuid fk tenants.id
loan_request_id uuid fk loan_requests.id
payroll_period_id uuid nullable fk payroll_periods.id
installment_number int
amount numeric
status varchar
paid_at timestamp nullable
created_at timestamp
updated_at timestamp
```

---

## 17.13 Invoice Tables

### invoices

```sql
id uuid pk
tenant_id uuid fk tenants.id
client_id uuid fk clients.id
invoice_number varchar
invoice_date date
due_date date
subtotal numeric
tax_amount numeric
discount_amount numeric
total_amount numeric
paid_amount numeric default 0
status varchar
file_id uuid nullable fk files.id
created_at timestamp
updated_at timestamp
```

### invoice_items

```sql
id uuid pk
tenant_id uuid fk tenants.id
invoice_id uuid fk invoices.id
description text
quantity numeric
unit_price numeric
amount numeric
reference_type varchar nullable
reference_id uuid nullable
created_at timestamp
updated_at timestamp
```

### invoice_payments

```sql
id uuid pk
tenant_id uuid fk tenants.id
invoice_id uuid fk invoices.id
payment_date date
amount numeric
payment_method varchar
reference_number varchar nullable
receipt_file_id uuid nullable
notes text nullable
created_at timestamp
updated_at timestamp
```

---

## 17.14 Performance, Incident, Asset Tables

### performance_reviews

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid fk employees.id
review_period_start date
review_period_end date
reviewer_id uuid nullable fk users.id
score numeric nullable
status varchar
created_at timestamp
updated_at timestamp
```

### performance_review_items

```sql
id uuid pk
tenant_id uuid fk tenants.id
performance_review_id uuid fk performance_reviews.id
criteria varchar
weight numeric
score numeric
notes text nullable
created_at timestamp
updated_at timestamp
```

### incident_reports

```sql
id uuid pk
tenant_id uuid fk tenants.id
employee_id uuid nullable fk employees.id
client_id uuid nullable fk clients.id
placement_id uuid nullable fk placements.id
reported_by uuid fk users.id
incident_date date
category varchar
description text
severity varchar
status varchar
created_at timestamp
updated_at timestamp
```

### assets

```sql
id uuid pk
tenant_id uuid fk tenants.id
code varchar
name varchar
category varchar
serial_number varchar nullable
condition varchar
status varchar
created_at timestamp
updated_at timestamp
```

### asset_assignments

```sql
id uuid pk
tenant_id uuid fk tenants.id
asset_id uuid fk assets.id
employee_id uuid fk employees.id
assigned_at date
returned_at date nullable
status varchar
notes text nullable
created_at timestamp
updated_at timestamp
```

---

## 17.15 Files, Approvals, Notifications, Audit

### files

```sql
id uuid pk
tenant_id uuid nullable fk tenants.id
bucket varchar
object_key varchar
original_name varchar
mime_type varchar
size_bytes bigint
checksum varchar nullable
visibility varchar -- private, public, signed
uploaded_by uuid nullable fk users.id
created_at timestamp
updated_at timestamp
deleted_at timestamp nullable
```

### approval_workflows

```sql
id uuid pk
tenant_id uuid fk tenants.id
module varchar
name varchar
description text nullable
is_active boolean
created_at timestamp
updated_at timestamp
```

### approval_steps

```sql
id uuid pk
tenant_id uuid fk tenants.id
approval_workflow_id uuid fk approval_workflows.id
step_order int
approver_type varchar -- role, user, supervisor, department_head, client
approver_role_id uuid nullable
approver_user_id uuid nullable
condition jsonb nullable
is_required boolean
created_at timestamp
updated_at timestamp
```

### approval_requests

```sql
id uuid pk
tenant_id uuid fk tenants.id
module varchar
reference_id uuid
requested_by uuid fk users.id
current_step int
status varchar
created_at timestamp
updated_at timestamp
```

### approval_actions

```sql
id uuid pk
tenant_id uuid fk tenants.id
approval_request_id uuid fk approval_requests.id
step_order int
approver_id uuid fk users.id
action varchar -- approved, rejected, revised
comment text nullable
acted_at timestamp
created_at timestamp
```

### notifications

```sql
id uuid pk
tenant_id uuid nullable fk tenants.id
user_id uuid fk users.id
title varchar
message text
type varchar
reference_type varchar nullable
reference_id uuid nullable
read_at timestamp nullable
created_at timestamp
```

### notification_templates

```sql
id uuid pk
tenant_id uuid nullable fk tenants.id
code varchar
channel varchar
subject varchar nullable
body text
is_active boolean
created_at timestamp
updated_at timestamp
```

### audit_logs

```sql
id uuid pk
tenant_id uuid nullable fk tenants.id
user_id uuid nullable fk users.id
action varchar
module varchar
entity_name varchar
entity_id uuid nullable
old_values jsonb nullable
new_values jsonb nullable
ip_address varchar nullable
user_agent text nullable
created_at timestamp
```

---

## 18. API ENDPOINT WAJIB

Semua endpoint diawali dengan `/api/v1`.

## 18.1 Auth

```txt
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/change-password
GET    /auth/me
GET    /auth/sessions
DELETE /auth/sessions/:id
```

## 18.2 Tenants

```txt
GET    /tenants
POST   /tenants
GET    /tenants/:id
PATCH  /tenants/:id
DELETE /tenants/:id
PATCH  /tenants/:id/status
GET    /tenants/:id/features
PATCH  /tenants/:id/features
```

## 18.3 Users, Roles, Permissions

```txt
GET    /users
POST   /users
GET    /users/:id
PATCH  /users/:id
DELETE /users/:id
POST   /users/:id/roles
DELETE /users/:id/roles/:roleId

GET    /roles
POST   /roles
GET    /roles/:id
PATCH  /roles/:id
DELETE /roles/:id
POST   /roles/:id/permissions

GET    /permissions
```

## 18.4 User Preferences, Appearance & Localization

```txt
GET    /settings/me/preferences
PATCH  /settings/me/preferences
GET    /settings/appearance
PATCH  /settings/appearance
GET    /settings/localization
PATCH  /settings/localization

GET    /i18n/locales
GET    /i18n/messages?locale=id-ID
GET    /i18n/messages?locale=en-US
GET    /i18n/keys
POST   /i18n/keys
PATCH  /i18n/keys/:id
POST   /i18n/translations
PATCH  /i18n/translations/:id

GET    /theme/config
PATCH  /theme/user-preference
```

## 18.5 Company & Organization

```txt
GET    /companies
POST   /companies
GET    /companies/:id
PATCH  /companies/:id
DELETE /companies/:id

GET    /branches
POST   /branches
GET    /work-locations
POST   /work-locations
PATCH  /work-locations/:id

GET    /departments
POST   /departments
PATCH  /departments/:id
DELETE /departments/:id

GET    /positions
POST   /positions
PATCH  /positions/:id
DELETE /positions/:id

GET    /organization/chart
```

## 18.6 Employees

```txt
GET    /employees
POST   /employees
GET    /employees/:id
PATCH  /employees/:id
DELETE /employees/:id
POST   /employees/import
GET    /employees/export
GET    /employees/:id/documents
POST   /employees/:id/documents
GET    /employees/:id/contracts
POST   /employees/:id/contracts
GET    /employees/:id/history
PATCH  /employees/:id/status
```

## 18.7 Clients & Services

```txt
GET    /clients
POST   /clients
GET    /clients/:id
PATCH  /clients/:id
DELETE /clients/:id
GET    /clients/:id/contacts
POST   /clients/:id/contacts
GET    /clients/:id/contracts
POST   /clients/:id/contracts

GET    /service-categories
POST   /service-categories
GET    /service-positions
POST   /service-positions
GET    /client-rate-cards
POST   /client-rate-cards
```

## 18.8 Manpower Requests

```txt
GET    /manpower-requests
POST   /manpower-requests
GET    /manpower-requests/:id
PATCH  /manpower-requests/:id
DELETE /manpower-requests/:id
POST   /manpower-requests/:id/submit
POST   /manpower-requests/:id/approve
POST   /manpower-requests/:id/reject
POST   /manpower-requests/:id/convert-to-requisition
```

## 18.9 Recruitment

```txt
GET    /job-requisitions
POST   /job-requisitions
PATCH  /job-requisitions/:id

GET    /vacancies
POST   /vacancies
PATCH  /vacancies/:id
POST   /vacancies/:id/publish
POST   /vacancies/:id/close

GET    /candidates
POST   /candidates
GET    /candidates/:id
PATCH  /candidates/:id
POST   /candidates/:id/documents
POST   /candidates/:id/blacklist

GET    /candidate-applications
POST   /candidate-applications
PATCH  /candidate-applications/:id/stage

POST   /interviews
PATCH  /interviews/:id
POST   /interviews/:id/result

POST   /candidate-offers
PATCH  /candidate-offers/:id
POST   /candidate-offers/:id/accept
POST   /candidate-offers/:id/reject

POST   /candidate-applications/:id/convert-to-employee
```

## 18.10 Contracts

```txt
GET    /contracts
POST   /contracts
GET    /contracts/:id
PATCH  /contracts/:id
DELETE /contracts/:id
POST   /contracts/:id/generate-pdf
POST   /contracts/:id/send-signature
POST   /contracts/:id/mark-signed
POST   /contracts/:id/renew
GET    /contracts/expiring
```

## 18.11 Placements

```txt
GET    /placements
POST   /placements
GET    /placements/:id
PATCH  /placements/:id
DELETE /placements/:id
POST   /placements/:id/activate
POST   /placements/:id/complete
POST   /placements/:id/rotate
POST   /placements/:id/replace
GET    /placements/:id/history

GET    /replacement-requests
POST   /replacement-requests
PATCH  /replacement-requests/:id
POST   /replacement-requests/:id/approve
POST   /replacement-requests/:id/reject
```

## 18.12 Schedule & Attendance

```txt
GET    /shifts
POST   /shifts
PATCH  /shifts/:id
DELETE /shifts/:id

GET    /employee-schedules
POST   /employee-schedules
POST   /employee-schedules/bulk
PATCH  /employee-schedules/:id

POST   /attendance/check-in
POST   /attendance/check-out
GET    /attendance/me
GET    /attendance
GET    /attendance/:id
POST   /attendance/corrections
POST   /attendance/corrections/:id/approve
POST   /attendance/corrections/:id/reject
GET    /attendance/reports/summary
```

## 18.13 Biometric

```txt
GET    /biometric/devices
POST   /biometric/devices
PATCH  /biometric/devices/:id
DELETE /biometric/devices/:id
POST   /biometric/devices/:id/sync
GET    /biometric/logs
POST   /biometric/logs/import
POST   /biometric/employees/map
```

## 18.14 Leave, Permission, Overtime

```txt
GET    /leave-types
POST   /leave-types
GET    /leave-balances
POST   /leave-balances/recalculate

GET    /leave-requests
POST   /leave-requests
GET    /leave-requests/:id
POST   /leave-requests/:id/approve
POST   /leave-requests/:id/reject
POST   /leave-requests/:id/cancel

GET    /permission-requests
POST   /permission-requests
POST   /permission-requests/:id/approve
POST   /permission-requests/:id/reject

GET    /overtime-requests
POST   /overtime-requests
POST   /overtime-requests/:id/approve
POST   /overtime-requests/:id/reject
```

## 18.15 Payroll

```txt
GET    /payroll/groups
POST   /payroll/groups

GET    /payroll/components
POST   /payroll/components
PATCH  /payroll/components/:id

GET    /payroll/periods
POST   /payroll/periods
PATCH  /payroll/periods/:id

GET    /payroll/runs
POST   /payroll/runs
GET    /payroll/runs/:id
POST   /payroll/runs/:id/calculate
POST   /payroll/runs/:id/approve
POST   /payroll/runs/:id/lock
POST   /payroll/runs/:id/cancel
GET    /payroll/runs/:id/items

GET    /salary-slips/me
GET    /salary-slips
POST   /salary-slips/:id/publish
GET    /salary-slips/:id/download
```

## 18.16 Reimbursement & Loan

```txt
GET    /reimbursement-types
POST   /reimbursement-types
GET    /reimbursement-requests
POST   /reimbursement-requests
POST   /reimbursement-requests/:id/approve
POST   /reimbursement-requests/:id/reject
POST   /reimbursement-requests/:id/mark-paid

GET    /loan-requests
POST   /loan-requests
POST   /loan-requests/:id/approve
POST   /loan-requests/:id/reject
GET    /loan-requests/:id/installments
```

## 18.17 Invoice

```txt
GET    /invoices
POST   /invoices
GET    /invoices/:id
PATCH  /invoices/:id
POST   /invoices/:id/generate-pdf
POST   /invoices/:id/send
POST   /invoices/:id/approve
POST   /invoices/:id/cancel
POST   /invoices/:id/payments
GET    /invoices/reports/aging
```

## 18.18 Approval

```txt
GET    /approval-workflows
POST   /approval-workflows
PATCH  /approval-workflows/:id

GET    /approval-requests
GET    /approval-requests/:id
POST   /approval-requests/:id/approve
POST   /approval-requests/:id/reject
POST   /approval-requests/:id/revise
```

## 18.19 Notification, Documents, Reports

```txt
GET    /notifications
PATCH  /notifications/:id/read
PATCH  /notifications/read-all

POST   /files/upload
GET    /files/:id
GET    /files/:id/signed-url
DELETE /files/:id

GET    /reports/:reportCode
POST   /reports/:reportCode/export
```

---

## 19. WEB PAGE / ROUTE REQUIREMENTS

## 19.1 Global Pages

- Login dengan language switcher dan theme toggle
- Forgot password
- Reset password
- Dashboard selector by role
- Profile
- Notification center
- Approval inbox
- Settings
- Appearance settings Light/Dark/System
- Language settings Bahasa Indonesia/English

## 19.2 Platform Admin Pages

- Tenants
- Subscription plans
- Tenant billing
- Feature flags
- Platform users
- System audit log
- System health
- Storage usage

## 19.3 Outsourcing Pages

- Outsourcing dashboard
- Clients
- Client detail
- Client contacts
- Client contracts
- Service catalog
- Rate cards
- Manpower requests
- Job requisitions
- Vacancies
- Candidates
- Interviews
- Offering
- Onboarding
- Employees
- Placements
- Replacement requests
- Schedules
- Attendance monitoring
- Leave/permission/overtime
- Payroll
- Salary slips
- Invoices
- Payments
- Performance
- Incidents
- Assets/uniform
- Training/certification
- Documents
- Reports

## 19.4 SaaS HRIS Pages

- HRIS dashboard
- Company profile
- Branches
- Work locations
- Departments
- Positions
- Organization chart
- Employees
- Employee detail
- Attendance
- Schedule
- Leave
- Permission
- Overtime
- Payroll
- Salary slips
- Reimbursement
- Loans
- Contracts
- Documents
- Performance
- Assets
- Training
- Reports
- Settings
- Appearance settings Light/Dark/System
- Language settings Bahasa Indonesia/English

## 19.5 Client Portal Pages

- Client dashboard
- Manpower request
- Active workers
- Attendance monitor
- Schedules
- Performance evaluation
- Replacement request
- Incident report
- Invoices
- Payments
- Contracts
- Reports
- Client users

---

## 20. MOBILE APP SCREEN REQUIREMENTS

## 20.1 Authentication

- Splash screen
- Login role selector
- Forgot password
- Reset password
- Permission request screen
- Device registration screen opsional

## 20.2 Employee

- Home dashboard
- Attendance check-in
- Attendance check-out
- Selfie capture
- GPS validation
- Attendance history
- Schedule
- Leave request
- Permission request
- Overtime request
- Reimbursement request
- Salary slip list
- Salary slip detail
- Profile
- Documents
- Contracts
- Notifications
- Approval status
- Settings
- Appearance settings Light/Dark/System
- Language settings Bahasa Indonesia/English

## 20.3 Supervisor / Manager

- Team dashboard
- Team attendance
- Team schedule
- Approval inbox
- Approve/reject leave
- Approve/reject overtime
- Approve/reject attendance correction
- Incident report
- Performance evaluation
- Worker detail

## 20.4 Client Mobile Portal

- Client dashboard
- Active workers
- Attendance monitor
- Manpower request
- Replacement request
- Invoice list
- Report summary
- Approval inbox

---

## 21. UI/UX REQUIREMENTS

## 21.1 Brand Direction

- Nama brand: KITalent
- Tampilan premium, tegas, clean, modern
- Jangan template generik
- Gunakan nuansa biru brand, putih, gray, dan semi-dark
- Komponen harus rapi dan enterprise-ready

## 21.2 Design Principles

- Clean dashboard
- Data-dense but readable
- Card grid untuk ringkasan
- Table dengan filter lengkap
- Sidebar jelas
- Header ringkas
- Status badge konsisten
- Empty state informatif
- Loading state
- Error state
- Confirmation dialog untuk aksi penting
- Mobile-first untuk Flutter
- Responsive web

## 21.3 Komponen Wajib

- Data table
- Filter panel
- Search bar
- Date range picker
- Status badge
- Approval timeline
- Activity log timeline
- Upload component
- File preview
- PDF viewer
- Dashboard cards
- Chart
- Modal form
- Drawer detail
- Stepper recruitment
- Organization chart
- Calendar view
- Shift roster view
- Payroll summary
- Invoice summary
- Theme toggle
- Language switcher

## 21.4 Light/Dark Mode Design Token

Semua UI harus menggunakan design token berikut, bukan warna hardcoded:

```txt
color.background
color.surface
color.surfaceElevated
color.border
color.text.primary
color.text.secondary
color.text.muted
color.primary
color.primaryForeground
color.success
color.warning
color.error
color.info
color.badge.*
color.chart.*
shadow.card
radius.card
spacing.section
```

Requirement visual:

1. Light Mode harus dominan putih, light gray, clean, premium, dan cocok untuk enterprise dashboard.
2. Dark Mode harus semi-dark, bukan hitam pekat berlebihan, tetap premium dan nyaman untuk data table.
3. Logo wajib memiliki varian yang terbaca di Light Mode dan Dark Mode.
4. Chart dan badge harus tetap memiliki kontras yang cukup di dua mode.
5. Semua form dan table harus diuji pada dua mode sebelum dianggap selesai.

## 21.5 Multi-Language UX

1. Switch bahasa harus mudah ditemukan di login page, header/profile menu, dan mobile settings.
2. Perubahan bahasa harus langsung berlaku tanpa logout.
3. Semua toast, dialog konfirmasi, error API, dan validation message wajib ikut berubah sesuai bahasa aktif.
4. Field data yang bersifat nama asli, nama client, nama karyawan, jabatan custom, dan nama dokumen tidak diterjemahkan otomatis.
5. Label sistem seperti status, modul, menu, permission, dan template notifikasi wajib memiliki translation key.

---

## 22. SECURITY REQUIREMENTS

1. Password hashing bcrypt/argon2.
2. JWT short-lived access token.
3. Refresh token rotation.
4. Redis token blacklist.
5. Tenant isolation at query level.
6. Permission guard for every endpoint.
7. Rate limiting login and sensitive endpoint.
8. File signed URL for private document.
9. Encryption for sensitive fields where needed.
10. Audit log for sensitive operation.
11. CORS restricted.
12. Helmet/security headers.
13. Input validation.
14. SQL injection prevention through ORM.
15. XSS prevention on frontend.
16. CSRF protection where relevant.
17. Secure mobile storage.
18. No sensitive data in logs.
19. Backup encryption.
20. Role separation for payroll and salary data.

---

## 23. NON-FUNCTIONAL REQUIREMENTS

## 23.1 Performance

- API response target < 500ms for common read.
- Dashboard initial load < 3 seconds.
- Attendance check-in/check-out < 2 seconds under normal condition.
- Payroll processing menggunakan queue untuk data besar.
- Report export menggunakan background job.

## 23.2 Scalability

- Multi-tenant support.
- Horizontal scaling untuk backend.
- Redis untuk cache/session/queue.
- MinIO untuk file object storage.
- Pagination wajib untuk list besar.
- Index database wajib untuk kolom filter.

## 23.3 Availability

- Backup database harian.
- Backup MinIO berkala.
- Error monitoring.
- Health check endpoint.
- Graceful shutdown.

## 23.4 Maintainability

- Modular architecture.
- DTO validation.
- Clean service layer.
- Repository pattern.
- Unit test untuk business logic.
- E2E test untuk flow penting.
- Swagger docs.

## 23.5 Compliance

- Data payroll dan identitas pribadi harus dibatasi.
- Kontrak dan dokumen legal harus memiliki audit trail.
- Aturan payroll, lembur, cuti, BPJS, pajak harus configurable.
- Jangan hardcode regulasi karena dapat berubah.

---

## 24. ENVIRONMENT VARIABLES

```env
NODE_ENV=development
APP_NAME=KITalent
APP_PORT=3000
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
MOBILE_DEEPLINK_SCHEME=kitalent

DATABASE_URL=postgresql://user:password@localhost:5432/kitalent
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kitalent
DB_USER=kitalent
DB_PASSWORD=secret

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=miniosecret
MINIO_BUCKET_PRIVATE=kitalent-private
MINIO_BUCKET_PUBLIC=kitalent-public
MINIO_USE_SSL=false

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

FCM_PROJECT_ID=
FCM_CLIENT_EMAIL=
FCM_PRIVATE_KEY=

WHATSAPP_GATEWAY_URL=
WHATSAPP_GATEWAY_TOKEN=

E_SIGNATURE_PROVIDER=
E_SIGNATURE_API_KEY=

PAYMENT_GATEWAY_PROVIDER=
PAYMENT_GATEWAY_SERVER_KEY=

RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

ENCRYPTION_KEY=change_me
```

---

## 25. BACKGROUND JOBS

Gunakan BullMQ/Redis untuk job berikut:

- Send notification
- Send email
- Send WhatsApp
- Generate salary slip PDF
- Generate invoice PDF
- Generate contract PDF
- Payroll calculation
- Report export
- Fingerprint sync
- Attendance anomaly scan
- Contract expiry reminder
- Document expiry reminder
- Subscription expiry reminder
- Daily attendance summary
- Backup trigger opsional

---

## 26. TESTING REQUIREMENTS

## 26.1 Unit Test

Wajib untuk:
- Payroll calculation
- Attendance validation
- Leave balance
- Overtime calculation
- Approval workflow
- Invoice calculation
- Permission guard
- Tenant isolation

## 26.2 Integration Test

Wajib untuk:
- Auth flow
- Employee CRUD
- Attendance check-in/out
- Leave request approval
- Payroll run
- Invoice generation
- File upload
- Notification

## 26.3 E2E Test

Flow wajib:
1. Tenant dibuat.
2. Company dibuat.
3. User dan role dibuat.
4. Employee dibuat.
5. Employee check-in/check-out.
6. Leave request diajukan dan disetujui.
7. Payroll diproses.
8. Slip gaji dipublish.
9. Client membuat manpower request.
10. Candidate direkrut.
11. Employee ditempatkan.
12. Invoice client dibuat.

---

## 27. SEED DATA WAJIB

Seed awal harus berisi:

1. Platform super admin.
2. Default permissions.
3. Default system roles.
4. Default subscription plans.
5. Default service categories.
6. Default document types.
7. Default leave types.
8. Default payroll components.
9. Default notification templates.
10. Default approval workflow templates.

---

## 28. ROADMAP FULL VERSION

## Phase 1 — Foundation

- Auth
- Tenant
- Theme system Light/Dark/System
- Localization system id-ID/en-US
- RBAC
- Company
- Employee
- File storage
- Audit log
- Basic dashboard

## Phase 2 — HRIS Core

- Organization
- Attendance
- Schedule
- Leave
- Overtime
- Payroll
- Salary slip
- Notification
- Mobile employee

## Phase 3 — Outsourcing Core

- Client
- Service catalog
- Manpower request
- Recruitment
- Candidate
- Contract
- Placement
- Client portal

## Phase 4 — Finance & Advanced HR

- Invoice
- Payment tracking
- Reimbursement
- Loan
- Performance
- Incident
- Asset/uniform
- Training

## Phase 5 — Enterprise

- Fingerprint integration
- E-signature
- WhatsApp notification
- Advanced analytics
- API/webhook
- White-label
- SSO
- Advanced report builder

---

## 29. ACCEPTANCE CRITERIA GLOBAL

Aplikasi dianggap memenuhi PRD jika:

1. Sistem mendukung Outsourcing Mode dan SaaS HRIS Mode.
2. Sistem multi-tenant dan data antar tenant tidak bocor.
3. Role dan permission berjalan granular.
4. Web dashboard dapat digunakan admin/operator/client/company.
5. Mobile app dapat digunakan employee, supervisor, dan client.
6. Attendance mendukung GPS, selfie, dan fingerprint integration.
7. Payroll dapat dihitung dari attendance, leave, overtime, reimbursement, loan, dan component.
8. Salary slip dapat digenerate dan dilihat employee.
9. Client dapat membuat manpower request.
10. Recruitment dapat mengubah candidate menjadi employee.
11. Employee dapat ditempatkan ke client/lokasi.
12. Invoice client dapat dibuat dari data outsourcing.
13. Approval workflow berjalan untuk semua modul penting.
14. File tersimpan di MinIO.
15. Notifikasi berjalan via in-app dan FCM.
16. Audit log tersedia untuk aksi penting.
17. Report dan export tersedia.
18. UI web dan mobile rapi, premium, dan konsisten brand.
19. Web dan mobile mendukung Light Mode, Dark Mode, dan System Mode.
20. Web dan mobile mendukung Bahasa Indonesia dan English yang bisa diganti user.
21. Tidak ada text UI hardcoded; semua text menggunakan translation key.
22. API terdokumentasi Swagger.
23. Semua modul utama memiliki test minimal untuk business logic.

---

## 30. BATASAN DAN HAL YANG TIDAK BOLEH DILAKUKAN

1. Jangan membuat aplikasi hanya untuk satu perusahaan.
2. Jangan menghapus konsep multi-tenant.
3. Jangan membuat role hardcoded di frontend saja.
4. Jangan menyimpan file langsung di database.
5. Jangan menyimpan password/token plain text.
6. Jangan mencampur data tenant.
7. Jangan membuat payroll hardcoded satu formula.
8. Jangan membuat attendance tanpa audit.
9. Jangan membuat approval statis hanya satu level.
10. Jangan membuat UI asal jadi.
11. Jangan membuat aplikasi hanya satu bahasa.
12. Jangan hardcode text UI langsung di component.
13. Jangan membuat theme hanya light atau hanya dark. Dua-duanya wajib tersedia.
11. Jangan melewati modul contract, payroll, invoice, attendance, recruitment, dan placement karena itu inti aplikasi.
12. Jangan membuat Internal Mode sebagai mode produk terpisah.
13. Jangan menggunakan local storage untuk data sensitif di mobile selain token secure storage.
14. Jangan membuat endpoint list tanpa pagination.
15. Jangan membuat export report sinkron untuk data besar; gunakan background job.

---

## 31. PRIORITAS FITUR PALING KRITIS

Fitur yang tidak boleh terlewat:

1. Multi-tenant
2. RBAC
3. Tenant mode: Outsourcing / SaaS HRIS / Hybrid
4. Employee management
5. Client management
6. Manpower request
7. Recruitment
8. Contract management
9. Placement management
10. Attendance GPS/selfie/fingerprint
11. Schedule/shift
12. Leave/permission/overtime
13. Payroll
14. Salary slip
15. Invoice client
16. Approval workflow
17. Notification
18. Document management
19. Reporting
20. Audit log

---

## 32. CONTOH ALUR UTAMA

## 32.1 Alur Outsourcing End-to-End

1. Client login ke portal.
2. Client membuat manpower request.
3. Client mengisi posisi, jumlah, lokasi, tanggal mulai, dan kualifikasi.
4. Request masuk ke operator outsourcing.
5. Operation manager review request.
6. Recruitment officer membuat vacancy.
7. Candidate mendaftar.
8. Candidate discreening.
9. Interview dijadwalkan.
10. Candidate lolos.
11. Offering dibuat.
12. Candidate diterima.
13. Candidate dikonversi menjadi employee.
14. Legal membuat kontrak kerja.
15. Employee ditempatkan ke client.
16. Shift dibuat.
17. Employee absen via mobile/fingerprint.
18. Supervisor memonitor attendance.
19. Payroll diproses.
20. Invoice client dibuat.
21. Client membayar invoice.
22. Performance dievaluasi.
23. Kontrak diperpanjang atau placement selesai.

## 32.2 Alur SaaS HRIS

1. Company owner membuat tenant.
2. HR membuat company profile.
3. HR membuat struktur organisasi.
4. HR membuat employee.
5. HR mengatur shift dan policy.
6. Employee login mobile.
7. Employee check-in/check-out.
8. Employee mengajukan cuti/lembur/reimbursement.
9. Supervisor approve.
10. Payroll admin memproses payroll.
11. Payroll manager approve.
12. Slip gaji dipublish.
13. Employee melihat slip gaji.
14. Management melihat report.

---

## 33. DATA RELATIONSHIP RINGKAS

```txt
Tenant
 ├── Users
 ├── Roles
 ├── Companies
 │    ├── Branches
 │    ├── Departments
 │    ├── Positions
 │    └── Employees
 ├── Clients
 │    ├── Client Contracts
 │    ├── Manpower Requests
 │    ├── Placements
 │    └── Invoices
 ├── Candidates
 │    └── Applications
 ├── Employees
 │    ├── Contracts
 │    ├── Documents
 │    ├── Schedules
 │    ├── Attendances
 │    ├── Leave Requests
 │    ├── Overtime Requests
 │    ├── Payroll Items
 │    └── Salary Slips
 ├── Approval Workflows
 ├── Notifications
 ├── Files
 └── Audit Logs
```

---

## 34. DEVELOPMENT COMMAND TARGET

AI agent harus menyiapkan command standar:

```bash
# install dependencies
pnpm install

# start database, redis, minio
docker compose up -d postgres redis minio

# run migration
pnpm api:migrate

# seed initial data
pnpm api:seed

# run backend
pnpm dev:api

# run web
pnpm dev:web

# run mobile
cd apps/mobile && flutter pub get && flutter run
```

---

## 35. DEFINITION OF DONE

Setiap fitur dianggap selesai jika:

1. Backend API selesai.
2. DTO validation selesai.
3. Permission guard selesai.
4. Tenant guard selesai.
5. Database migration selesai.
6. Audit log aktif.
7. Unit/integration test minimal selesai.
8. Swagger documentation tersedia.
9. Web UI selesai jika fitur untuk web.
10. Mobile UI selesai jika fitur untuk mobile.
11. Error handling selesai.
12. Loading/empty state selesai.
13. Export/import selesai jika diperlukan.
14. Notification trigger selesai jika diperlukan.
15. Dokumentasi singkat tersedia.

---

## 36. CATATAN FINAL UNTUK AGENT AI

Bangun KITalent sebagai produk enterprise, bukan prototype sederhana.

Fokus utama:
- Outsourcing management harus lengkap.
- SaaS HRIS harus lengkap.
- Multi-tenant harus benar.
- RBAC harus kuat.
- Payroll harus configurable.
- Attendance harus aman dan valid.
- Client portal harus siap digunakan.
- Employee mobile app harus nyaman.
- UI harus premium dan tegas.
- UI wajib mendukung Light Mode dan Dark Mode.
- Aplikasi wajib mendukung Bahasa Indonesia dan English dengan translation key.
- Struktur kode harus rapi dan scalable.

Dokumen ini adalah baseline. Semua keputusan teknis yang belum eksplisit harus mengikuti prinsip enterprise, security-first, scalable, maintainable, dan tidak mengorbankan fitur inti.
