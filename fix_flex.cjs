const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const newFlexMsg = `
      const flexMessage = {
        to: lineUid,
        messages: [
          {
            type: "flex",
            altText: \`อัปเดตสถานะคิว: \${newStatus}\`,
            contents: {
              type: "bubble",
              size: "mega",
              header: {
                type: "box",
                layout: "vertical",
                paddingAll: "0px",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: color,
                    height: "8px",
                    contents: []
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    paddingTop: "20px",
                    paddingBottom: "20px",
                    alignItems: "center",
                    backgroundColor: "#f4fcf9",
                    contents: [
                       {
                         type: "box",
                         layout: "vertical",
                         width: "48px",
                         height: "48px",
                         backgroundColor: "#ffffff",
                         cornerRadius: "48px",
                         alignItems: "center",
                         justifyContent: "center",
                         borderWidth: "semi-bold",
                         borderColor: color,
                         contents: [
                           {
                             type: "text",
                             text: icon,
                             size: "xl",
                             color: color,
                             weight: "bold",
                             align: "center",
                             gravity: "center"
                           }
                         ]
                       },
                       {
                         type: "text",
                         text: newStatus,
                         weight: "bold",
                         size: "xl",
                         color: "#1e293b",
                         margin: "md"
                       },
                       {
                         type: "text",
                         text: "แสดง E-Ticket นี้ให้พนักงานเมื่อมาถึงสาขา",
                         size: "xs",
                         color: "#64748b",
                         margin: "sm"
                       }
                    ]
                  },
                  {
                    type: "separator",
                    color: color,
                    style: "dashed"
                  }
                ]
              },
              body: {
                type: "box",
                layout: "vertical",
                paddingAll: "20px",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#f8fafc",
                    borderColor: "#e2e8f0",
                    borderWidth: "normal",
                    cornerRadius: "xl",
                    paddingAll: "15px",
                    alignItems: "center",
                    contents: [
                      {
                        type: "text",
                        text: "เวลานัดหมาย",
                        size: "xs",
                        color: "#94a3b8",
                        weight: "bold"
                      },
                      {
                        type: "text",
                        text: (dtObj && !isNaN(dtObj.getTime())) ? dtObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : "-",
                        size: "4xl",
                        weight: "bold",
                        color: color,
                        margin: "md"
                      },
                      {
                        type: "text",
                        text: (dtObj && !isNaN(dtObj.getTime())) ? dtObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : "-",
                        size: "sm",
                        color: "#475569",
                        weight: "bold",
                        margin: "sm"
                      }
                    ]
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    margin: "xl",
                    spacing: "sm",
                    contents: [
                      {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                          { type: "text", text: "บริการ", color: "#94a3b8", size: "sm", flex: 2 },
                          { type: "text", text: booking.courseName || "บริการ", weight: "bold", color: "#334155", size: "sm", flex: 5, wrap: true, align: "end" }
                        ]
                      },
                      {
                        type: "box",
                        layout: "horizontal",
                        margin: "md",
                        contents: [
                          { type: "text", text: "สาขา", color: "#94a3b8", size: "sm", flex: 2 },
                          { type: "text", text: booking.branch || "-", weight: "bold", color: "#334155", size: "sm", flex: 5, align: "end" }
                        ]
                      },
                      {
                        type: "box",
                        layout: "horizontal",
                        margin: "md",
                        contents: [
                          { type: "text", text: "หมายเลขคิว", color: "#94a3b8", size: "sm", flex: 3 },
                          { type: "text", text: booking.ticketNo || booking.id, weight: "bold", color: "#334155", size: "xs", flex: 5, align: "end" }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          }
        ]
      };
`;

const oldStart = '      const flexMessage = {';
const oldEnd = '        ]\n      };';

const regex = new RegExp('      const flexMessage = \\{[\\s\\S]*?\\]\\n      \\};');
content = content.replace(regex, newFlexMsg.trim());

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Updated LINE Flex message format");
