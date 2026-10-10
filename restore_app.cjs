const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const missingBlock = `                 </React.Fragment>
               )})}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto print:overflow-visible print:h-auto p-4 sm:p-6 lg:p-8 w-full relative z-10">
          
          {courses.length === 0 && customersRaw.length === 0 && histories.length === 0 && activeTab !== 'settings' && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-0 flex flex-col items-center justify-center p-6">
               <div className="bg-white p-8 rounded-3xl shadow-xl border border-teal-100 text-center max-w-md animate-pulse">
                  <div className="w-16 h-16 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-4"><Upload size={32} /></div>
                  <h3 className="text-lg font-black text-gray-800 mb-2">ฐานข้อมูลว่างเปล่า (เชื่อมต่อ Firebaseแล้ว)</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">กรุณากดปุ่ม <b>"นำเข้า..."</b> ที่มุมขวาบน เพื่ออัปโหลดไฟล์ CSV เข้าสู่ระบบฐานข้อมูลคลาวด์ของคุณครับ</p>
               </div>
            </div>
          )}

        {/* --- PROMOTIONS TAB --- */}
        {activeTab === 'promotions' && (
          <PromotionManager 
             products={products} 
             masterCourses={masterCourses} 
             promotions={promotions}
             showToast={showToast} 
          />
        )}

        {/* --- COUPONS TAB --- */}
        {activeTab === 'coupons' && (
          <CouponManager 
             showToast={showToast} 
             customers={customers}
             products={products}
             masterCourses={masterCourses}
          />
        )}

        {/* --- MARKETING PROMOS TAB --- */}
        {activeTab === 'marketing_promos' && (
          <MarketingPromoManager 
             showToast={showToast} 
          />
        )}

        {/* --- GAMIFICATION TAB --- */}
        {activeTab === 'gamification' && (
          <GamificationManager 
             showToast={showToast} 
             customers={customers}
          />
        )}

          {activeTab === 'pos' && (
            <ErrorBoundary>
            <POSSystem 
              products={products}
              branches={branches}
              promotions={promotions}
              masterCourses={allMasterCourses}
              customers={customers}
              courses={processedCourses}
              histories={histories}
              bookings={bookings}
              orders={orders}
              dailySales={dailySales}
              showToast={triggerToast}
              globalBranch={globalBranch}
              globalRole={globalRole}
              appSettings={appSettings}
              employees={employees}
              employeeAttendance={employeeAttendance}
              clockedInEmployees={clockedInEmployees}
              wooImagesMap={wooImagesMap}
              wooIdMap={wooIdMap}
              onOpenVipForm={(customer) => {
                 setSelectedCustomer(customer);
                 setIsVipFormOpen(true);
              }}
              onChangeBranch={() => {
                localStorage.removeItem('selectedBranch');
                setGlobalBranch(null);
              }}
              onViewCustomerProfile={(rawCustomer) => {
                const processed = customers.find(c => c.id === rawCustomer.id);
                setSelectedCustomer(processed || rawCustomer);
                setActiveTab('customers');
              }}
              posPreselectedCustomer={posPreselectedCustomer}
              clearPosPreselectedCustomer={() => setPosPreselectedCustomer(null)}
              onGoToLogin={() => setShowBranchSelectForPos(true)}
              onGoBack={() => setActiveTab('dashboard')}
              onAddCustomer={() => setIsAddCustomerOpen(true)}
            />
            </ErrorBoundary>
          )}

          {activeTab === 'course_deduction' && (
            <CourseDeductionSystem
              customers={customers}
              masterCourses={masterCourses}
              employees={employees}
              globalBranch={globalBranch}
              showToast={triggerToast}
              onGoBack={() => setActiveTab('dashboard')}
              histories={histories}
            />
          )}
          
          {/* STAFF DASHBOARD */}
          {activeTab === 'dashboard' && globalRole !== 'owner' && (
            <div className="flex flex-col h-full animate-in fade-in max-w-5xl mx-auto w-full px-2 sm:px-0">
               <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div className="flex items-center gap-3">
                   {clockedInEmployees.length > 0 ? (
                <div className="flex -space-x-2">
                  {clockedInEmployees.slice(0, 3).map((emp, idx) => (
                    emp.profileImage ? (
                      <img key={emp.id} src={emp.profileImage} className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-white object-cover shadow-sm relative bg-white" style={{ zIndex: 3 - idx }} alt={emp.name} onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'; }} />
                    ) : (
                      <div key={emp.id} className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-white bg-slate-100 text-slate-400 flex items-center justify-center shadow-sm relative" style={{ zIndex: 3 - idx }}>
                        <User className="w-4 h-4 sm:w-6 sm:h-6" />
                      </div>
                    )
                  ))}
                       {clockedInEmployees.length > 3 && (
                         <div className="w-12 h-12 rounded-full border-2 border-white bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold shadow-sm relative z-0">
                           +{clockedInEmployees.length - 3}
                         </div>
                       )}
                     </div>
                   ) : (
                     <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-inner border border-indigo-200">
                       <User size={24} />
                     </div>
                   )}
                   <div>
`;

const badBlock = `                               onClick={() => { localStorage.removeItem('selectedBranch'); localStorage.removeItem('userRole'); setGlobalBranch(null); setGlobalRole('staff'); }}`;

content = content.replace(badBlock, missingBlock + `                      onClick={() => { localStorage.removeItem('selectedBranch'); localStorage.removeItem('userRole'); setGlobalBranch(null); setGlobalRole('staff'); }}`);

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Restored App.jsx part 1");
