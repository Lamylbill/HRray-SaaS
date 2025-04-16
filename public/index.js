require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

const token = process.env.TELEGRAM_TOKEN;
const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, anonKey);
const serviceSupabase = createClient(supabaseUrl, serviceKey);
const bot = new TelegramBot(token, { polling: true });

const leaveApplications = {};
let leaveTypesMap = {}; // Map to store leave type UUIDs and names

// Helper Functions

function isValidDate(input) {
  if (input.length !== 6) return false;
  const day = parseInt(input.slice(0, 2));
  const month = parseInt(input.slice(2, 4)) - 1;
  const year = parseInt('20' + input.slice(4, 6));
  const date = new Date(year, month, day);
  return date && date.getDate() === day && date.getMonth() === month;
}

function formatDate(input) {
  const day = input.slice(0, 2);
  const month = input.slice(2, 4);
  const year = '20' + input.slice(4, 6);
  return `${year}-${month}-${day}`;
}
function calculateWorkingDays(startDate, endDate) {
  let start = new Date(startDate);
  let end = new Date(endDate);
  let workingDays = 0;
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      workingDays++;
    }
  }
  return workingDays;
}
function doRangesOverlap(start1, end1, start2, end2) {
  return start1 <= end2 && start2 <= end1;
}

// Fetch leave types at the beginning
async function fetchLeaveTypes() {
  const { data, error } = await serviceSupabase.from('leave_types').select('*');
  if (error) {
    console.error('Error fetching leave types:', error);
    return;
  }
  data.forEach((type) => {
    leaveTypesMap[type.id] = type.name;
  });
}
fetchLeaveTypes();

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  // Handle /start <UUID>
  if (text.startsWith('/start')) {
    const parts = text.split(' ');
    if (parts.length === 2) {
      const uid = parts[1];

      const { data: userCheck, error: userError } = await serviceSupabase
        .from('employees')
        .select('user_id')
        .eq('user_id', uid)
        .limit(1)
        .single();

      if (userError || !userCheck) {
        bot.sendMessage(chatId, 'Invalid employer code. Please check with HR.');
        return;
      }

      leaveApplications[chatId] = { step: 'awaiting_name', data: { user_id: uid } };
      bot.sendMessage(chatId, 'Please enter your full name as per HR records.');
      return;
    }

    bot.sendMessage(chatId, 'Welcome to HRFlow Leave Bot 🤖\nType /applyleave to apply for leave.');
    return;
  }

  const leaveApp = leaveApplications[chatId];

  if (leaveApp && leaveApp.step === 'awaiting_name') {
    const cleanText = text.trim().replace(/\s+/g, ' ');

    const { data: employeeCheck, error: employeeError } = await serviceSupabase
      .from('employees')
      .select('id, full_name')
      .eq('user_id', leaveApp.data.user_id)
      .ilike('full_name', cleanText)
      .maybeSingle();

    if (employeeError || !employeeCheck) {
      bot.sendMessage(chatId, 'Name not found. Please check with HR.');
      delete leaveApplications[chatId];
      return;
    }

    //Clear previous
    await serviceSupabase
      .from('employees')
      .update({ telegram_user_id: null })
      .eq('telegram_user_id', chatId);

    const { error: updateError } = await serviceSupabase
      .from('employees')
      .update({ telegram_user_id: chatId })
      .eq('id', employeeCheck.id);

    if (updateError) {
      console.error('Failed to update telegram_user_id:', updateError);
      bot.sendMessage(chatId, 'An error occurred during registration. Please contact HR.');
      return;
    } else {
      console.log(`✅ Updated telegram_user_id for employee: ${employeeCheck.id} with chatId: ${chatId}`);
    }

    delete leaveApplications[chatId];
    bot.sendMessage(chatId, `Registration complete! Hello ${cleanText}, you can now apply for leave using /applyleave`);
    return;
  }
  const { data: employee, error: findError } = await serviceSupabase
    .from('employees')
    .select('id, user_id')
    .eq('telegram_user_id', chatId)
    .single();
  if (findError || !employee) {
    bot.sendMessage(chatId, 'Please click the /start link provided by your HR to register.');
    return;
  }
  // Apply Leave Flow
  if (text === '/applyleave') {
    const leaveTypes = Object.values(leaveTypesMap).map((name, index) => `${index + 1}. ${name}`).join('\n');

    leaveApplications[chatId] = { step: 'awaiting_leave_type', data: {} };
    bot.sendMessage(chatId, `Choose Leave Type:\n${leaveTypes}`);
    return;
  }
  if (text === '/myleave') {
    const { data: leaveRequests, error: requestsError } = await serviceSupabase
      .from('leave_requests')
      .select('id, start_date, end_date, notes, status, leave_type_id')
      .eq('employee_id', employee.id)
      .eq('status', 'Pending');

    if (requestsError) {
      console.error('Error fetching pending leave requests:', requestsError);
      bot.sendMessage(chatId, 'An error occurred. Please try again.');
      return;
    }
    if (leaveRequests.length === 0) {
      bot.sendMessage(chatId, 'You have no pending leave requests.');
      return;
    }
    leaveRequests.forEach((req) => {
      const startDate = new Date(req.start_date).toLocaleDateString();
      const endDate = new Date(req.end_date).toLocaleDateString();
      const leaveType = leaveTypesMap[req.leave_type_id];
      const summary = `
Leave Application Summary:
Leave Type: ${leaveType}
Start Date: ${startDate}
End Date: ${endDate}
Reason: ${req.notes || 'None'}
Status : ${req.status}

Confirm? (1 for Yes / 2 for No)
`;
      const keyboard = {
        inline_keyboard: [
          [{ text: 'Cancel', callback_data: `cancel_${req.id}` }],
        ],
      };
      bot.sendMessage(chatId, summary, { reply_markup: keyboard });
    });
  }

  if (leaveApp) {
    const step = leaveApp.step;

    if (step === 'awaiting_leave_type') {
      const index = parseInt(text) - 1;
      const leaveTypeIds = Object.keys(leaveTypesMap);
      if (isNaN(index) || index < 0 || index >= leaveTypeIds.length) {
        bot.sendMessage(chatId, 'Invalid input. Enter a valid number for Leave Type.');
        return;
      }
      leaveApp.data.leave_type_id = leaveTypeIds[index];

      leaveApp.step = 'awaiting_start_date';
      bot.sendMessage(chatId, 'Enter Leave Start Date (DDMMYY)');
      return;
    }

    if (step === 'awaiting_start_date') {
      if (!isValidDate(text)) {
        bot.sendMessage(chatId, 'Invalid date format. Please enter as DDMMYY.');
        return;
      }

      leaveApp.data.start_date = text;
      leaveApp.step = 'awaiting_end_date';
      bot.sendMessage(chatId, 'Enter Leave End Date (DDMMYY)');
      return;
    }

    if (step === 'awaiting_end_date') {
      if (!isValidDate(text)) {
        bot.sendMessage(chatId, 'Invalid date format. Please enter as DDMMYY.');
        return;
      }

      leaveApp.data.end_date = text;
      leaveApp.step = 'awaiting_reason';
      bot.sendMessage(chatId, 'Enter Reason for Leave (optional). Type "-" to skip.');
      return;
    }

    if (step === 'awaiting_reason') {
      leaveApp.data.reason = text === '-' ? '' : text;
      leaveApp.step = 'confirm';

      const startDate = formatDate(leaveApp.data.start_date);
      const endDate = formatDate(leaveApp.data.end_date);
      const workingDays = calculateWorkingDays(startDate, endDate);

      // Fetch leave quota
      const { data: quotaData, error: quotaError } = await serviceSupabase
        .from('leave_quotas')
        .select('quota_days, taken_days')
        .eq('employee_id', employee.id)
        .eq('leave_type_id', leaveApp.data.leave_type_id)
        .single();
      if (quotaError) {
        console.error('Error fetching leave quota:', quotaError);
        bot.sendMessage(chatId, 'An error occurred. Please try again.');
        return;
      }
      const availableBalance = quotaData.quota_days - quotaData.taken_days;
      if (workingDays > availableBalance) {
        bot.sendMessage(
          chatId,
          `You have only ${availableBalance} days for this leave type. Your request is for ${workingDays} days. Please enter a valid leave.`
        );
        delete leaveApplications[chatId];
        return;
      }
      // Check for start date > end date
      if (new Date(startDate) > new Date(endDate)) {
        bot.sendMessage(chatId, 'Start date cannot be after end date. Please enter a valid leave.');
        delete leaveApplications[chatId];
        return;
      }

      // Check for overlapping leave requests
      const { data: leaveRequests, error: requestsError } = await serviceSupabase
        .from('leave_requests')
        .select('start_date, end_date, status')
        .eq('employee_id', employee.id)
        .in('status', ['Pending', 'Approved']);

      if (requestsError) {
        console.error('Error fetching existing leave requests:', requestsError);
        bot.sendMessage(chatId, 'An error occurred. Please try again.');
        return;
      }
      const isOverlapping = leaveRequests.some((req) => {
        const reqStartDate = new Date(req.start_date);
        const reqEndDate = new Date(req.end_date);
        return doRangesOverlap(new Date(startDate), new Date(endDate), reqStartDate, reqEndDate);
      });
      if (isOverlapping) {
        bot.sendMessage(chatId, 'This leave request overlaps with an existing leave request. Please enter a valid leave.');
        delete leaveApplications[chatId];
        return;
      }

      const summary = `
Leave Application Summary:
Leave Type: ${leaveTypesMap[leaveApp.data.leave_type_id]}
Start Date: ${startDate}
End Date: ${endDate}
Reason: ${leaveApp.data.reason || 'None'}
Days: ${workingDays}

Confirm? (1 for Yes / 2 for No)
`;

      bot.sendMessage(chatId, summary);
      return;
    }

    if (step === 'confirm') {
      if (text === '1') {
        const startDate = formatDate(leaveApp.data.start_date);
        const endDate = formatDate(leaveApp.data.end_date);

        // 💬 Debug: Show what is being inserted
        console.log('Inserting leave request with:', {
          employee_id: employee.id,
          user_id: employee.user_id,
          leave_type_id: leaveApp.data.leave_type_id,
          start_date: startDate,
          end_date: endDate,
          notes: leaveApp.data.reason,
          status: 'Pending',
        });

        const { error } = await serviceSupabase.from('leave_requests').insert([
          {
            employee_id: employee.id,
            user_id: employee.user_id,
            leave_type_id: leaveApp.data.leave_type_id,
            start_date: startDate,
            end_date: endDate,
            notes: leaveApp.data.reason,
            status: 'Pending',
          },
        ]);
        if (error) {
          console.log(error);
          bot.sendMessage(chatId, 'An error has occurred. Please contact HR');
        }

        bot.sendMessage(chatId, 'Your leave application has been submitted! ✅');
        delete leaveApplications[chatId];
      } else if (text === '2') {
        bot.sendMessage(chatId, 'Leave application cancelled. Type /applyleave to start again.');
        delete leaveApplications[chatId];
      } else {
        bot.sendMessage(chatId, 'Invalid input. Enter 1 for Yes or 2 for No.');
      }
    }
  }
});
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith('cancel_')) {
    const requestId = data.split('_')[1];

    const { error } = await serviceSupabase
      .from('leave_requests')
      .update({ status: 'Cancelled' })
      .eq('id', requestId);

    if (error) {
      console.error('Error cancelling leave request:', error);
      bot.sendMessage(chatId, 'An error occurred while cancelling the leave request.');
      return;
    }

    bot.sendMessage(chatId, `Leave request ${requestId} has been cancelled.`);
  }
});
