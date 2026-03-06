import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

function createSeededRandom(seed) {
  var m = 2147483647;
  var a = 48271;
  var state = seed % m;
  if (state <= 0) {
    state += m - 1;
  }
  return function random() {
    state = (state * a) % m;
    return state / m;
  };
}

function parseCsvLine(line) {
  var result = [];
  var current = '';
  var inQuotes = false;
  var i = 0;
  for (i = 0; i < line.length; i += 1) {
    var char = line[i];
    var next = i + 1 < line.length ? line[i + 1] : '';
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCsv(text) {
  var lines = text.replace(/\r/g, '').split('\n').filter(function (line) {
    return line.trim().length > 0;
  });
  if (lines.length < 2) {
    return [];
  }
  var headers = parseCsvLine(lines[0]).map(function (h) {
    return h.trim();
  });
  var rows = [];
  var i = 1;
  for (i = 1; i < lines.length; i += 1) {
    var values = parseCsvLine(lines[i]);
    if (values.length === 0) {
      continue;
    }
    var row = {};
    var c = 0;
    for (c = 0; c < headers.length; c += 1) {
      var key = headers[c];
      row[key] = values[c] !== undefined ? values[c].trim() : '';
    }
    rows.push(row);
  }
  return rows;
}

function toInt(value) {
  var n = parseInt(value, 10);
  if (isNaN(n)) {
    return 0;
  }
  return n;
}

function normalizeRoleName(value) {
  var raw = String(value || '').trim().toLowerCase();
  if (raw === 'admin') {
    return 'Admin';
  }
  if (raw === 'scout') {
    return 'Scout';
  }
  if (raw === 'squad manager') {
    return 'Squad Manager';
  }
  if (raw === 'squad planner') {
    return 'Squad Planner';
  }
  if (raw === 'club2club') {
    return 'Club2Club';
  }
  return '';
}

function parseRoles(rawRoleValue, rawRolesValue) {
  var source = String(rawRolesValue || rawRoleValue || '');
  var parts = source.split(/[|;,]/);
  var map = {};
  var ordered = [];
  parts.forEach(function (part) {
    var role = normalizeRoleName(part);
    if (role && !map[role]) {
      map[role] = true;
      ordered.push(role);
    }
  });
  return ordered;
}

function normalizeClubRow(raw) {
  return {
    upload_date: raw.upload_date,
    club_name: raw.club_name,
    contract_seats: toInt(raw.contract_seats),
    active_users: toInt(raw.active_users),
    reports_created: toInt(raw.reports_created),
    shortlist_edits: toInt(raw.shortlist_edits),
    searches_performed: toInt(raw.searches_performed),
    shortlists_usage: toInt(raw.shortlists_usage),
    scouting_status_usage: toInt(raw.scouting_status_usage),
    appointments_created: toInt(raw.appointments_created),
    area_search_visits: toInt(raw.area_search_visits),
    squad_planner_visits: toInt(raw.squad_planner_visits),
    club2club_visits: toInt(raw.club2club_visits),
    speech2report_count: toInt(raw.speech2report_count),
    lineup_detector_count: toInt(raw.lineup_detector_count),
    push_alerts_sent: toInt(raw.push_alerts_sent),
    mail_alerts_sent: toInt(raw.mail_alerts_sent),
    custom_dashboards_count: toInt(raw.custom_dashboards_count),
    players_created: toInt(raw.players_created),
    teams_created: toInt(raw.teams_created),
    matches_created: toInt(raw.matches_created),
    data_conflicts_current: toInt(raw.data_conflicts_current),
    data_conflicts_resolved: toInt(raw.data_conflicts_resolved)
  };
}

function normalizeUserRow(raw) {
  var parsedRoles = parseRoles(raw.role, raw.roles);
  return {
    upload_date: raw.upload_date,
    club_name: raw.club_name,
    user_id: raw.user_id,
    user_name: raw.user_name,
    role: parsedRoles.length > 0 ? parsedRoles[0] : normalizeRoleName(raw.role),
    roles: parsedRoles,
    last_login_date: raw.last_login_date,
    logins_30d: toInt(raw.logins_30d),
    reports_created_30d: toInt(raw.reports_created_30d),
    searches_30d: toInt(raw.searches_30d)
  };
}

function addDays(dateString, days) {
  var d = new Date(dateString + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatShortDate(dateStr) {
  if (!dateStr) {
    return '';
  }
  return dateStr.slice(5);
}

function daysBetween(dateA, dateB) {
  var a = new Date(dateA + 'T00:00:00').getTime();
  var b = new Date(dateB + 'T00:00:00').getTime();
  return Math.floor((a - b) / (1000 * 60 * 60 * 24));
}

function getStatusFromZScore(zScore, currentVal, avg, stdDev) {
  if (avg <= 0) {
    return 'HEALTHY';
  }
  if (stdDev === 0) {
    if (currentVal < avg) {
      return 'WARNING';
    }
    return 'HEALTHY';
  }
  if (zScore <= -2) {
    return 'CRITICAL';
  }
  if (zScore <= -1) {
    return 'WARNING';
  }
  return 'HEALTHY';
}

function stdDevFromRows(rows, key) {
  if (!rows || rows.length === 0) {
    return 0;
  }
  var mean = 0;
  rows.forEach(function (r) {
    mean += r[key];
  });
  mean = mean / rows.length;
  var variance = 0;
  rows.forEach(function (r) {
    var diff = r[key] - mean;
    variance += diff * diff;
  });
  variance = variance / rows.length;
  return Math.sqrt(variance);
}

function colorByStatus(status) {
  if (status === 'CRITICAL') {
    return '#ff4757';
  }
  if (status === 'WARNING') {
    return '#ffa502';
  }
  return '#39FF14';
}

function getTierLabel(index, total) {
  var q = Math.ceil(total / 4);
  if (index < q) {
    return 1;
  }
  if (index < q * 2) {
    return 2;
  }
  if (index < q * 3) {
    return 3;
  }
  return 4;
}

function generateSampleData() {
  var random = createSeededRandom(20250301);
  var clubs = [
    { name: 'FC Bayern Munich', seats: 50 },
    { name: 'Borussia Dortmund', seats: 45 },
    { name: 'RB Leipzig', seats: 38 },
    { name: 'Bayer Leverkusen', seats: 35 },
    { name: 'VfB Stuttgart', seats: 25 },
    { name: 'SC Freiburg', seats: 20 },
    { name: 'Union Berlin', seats: 15 },
    { name: 'FC Augsburg', seats: 12 },
    { name: 'SV Darmstadt', seats: 10 },
    { name: 'FC Heidenheim', seats: 8 }
  ];
  var periods = [
    '2024-08-31',
    '2024-09-30',
    '2024-10-31',
    '2024-11-30',
    '2024-12-31',
    '2025-01-31'
  ];
  var clubRows = [];
  var userRows = [];
  var roleDist = [
    { role: 'Admin', pct: 0.08 },
    { role: 'Scout', pct: 0.44 },
    { role: 'Squad Manager', pct: 0.22 },
    { role: 'Squad Planner', pct: 0.16 },
    { role: 'Club2Club', pct: 0.1 }
  ];

  clubs.forEach(function (club, clubIndex) {
    var users = [];
    var seatCount = club.seats;
    var counts = [];
    var idx = 0;
    var assigned = 0;
    for (idx = 0; idx < roleDist.length; idx += 1) {
      var c = Math.floor(seatCount * roleDist[idx].pct);
      counts.push(c);
      assigned += c;
    }
    var rem = seatCount - assigned;
    idx = 0;
    while (rem > 0) {
      counts[idx % counts.length] += 1;
      rem -= 1;
      idx += 1;
    }
    var userCounter = 1;
    roleDist.forEach(function (r, ri) {
      var k = 0;
      for (k = 0; k < counts[ri]; k += 1) {
        var uid = 'USR-' + String(10000 + clubIndex * 200 + userCounter);
        var primaryRole = r.role;
        var userRoles = ['Scout'];
        if (primaryRole !== 'Scout') {
          userRoles.push(primaryRole);
        }
        if (primaryRole !== 'Admin' && random() > 0.82) {
          userRoles.push('Admin');
        }
        if (primaryRole !== 'Squad Manager' && random() > 0.86) {
          userRoles.push('Squad Manager');
        }
        if (primaryRole !== 'Squad Planner' && random() > 0.88) {
          userRoles.push('Squad Planner');
        }
        if (primaryRole !== 'Club2Club' && random() > 0.9) {
          userRoles.push('Club2Club');
        }
        var dedup = {};
        var uniqueRoles = [];
        userRoles.forEach(function (roleName) {
          if (!dedup[roleName]) {
            dedup[roleName] = true;
            uniqueRoles.push(roleName);
          }
        });
        users.push({
          user_id: uid,
          user_name: r.role + ' User ' + String(userCounter),
          role: primaryRole,
          roles: uniqueRoles
        });
        userCounter += 1;
      }
    });

    periods.forEach(function (period, pIndex) {
      var growth = 1 + pIndex * 0.04;
      var scale = seatCount / 50;
      function v(base, variance) {
        var noise = 1 + (random() * 2 - 1) * variance;
        return Math.max(0, Math.round(base * scale * growth * noise));
      }
      var activeUsers = Math.min(seatCount, Math.max(1, v(40, 0.12)));
      var row = {
        upload_date: period,
        club_name: club.name,
        contract_seats: seatCount,
        active_users: activeUsers,
        reports_created: v(320, 0.2),
        shortlist_edits: v(18, 0.25),
        searches_performed: v(180, 0.22),
        shortlists_usage: v(95, 0.22),
        scouting_status_usage: v(52, 0.22),
        appointments_created: v(36, 0.2),
        area_search_visits: v(130, 0.2),
        squad_planner_visits: v(104, 0.2),
        club2club_visits: v(70, 0.22),
        speech2report_count: v(2200, 0.2),
        lineup_detector_count: v(4900, 0.2),
        push_alerts_sent: v(3500, 0.2),
        mail_alerts_sent: v(980, 0.2),
        custom_dashboards_count: v(165, 0.2),
        players_created: v(1500, 0.2),
        teams_created: v(50, 0.2),
        matches_created: v(920, 0.2),
        data_conflicts_current: Math.max(0, v(10, 0.4) - Math.round(pIndex * 0.3)),
        data_conflicts_resolved: v(150, 0.2)
      };
      clubRows.push(row);

      users.forEach(function (u) {
        var daysAgo = Math.floor(random() * 31);
        userRows.push({
          upload_date: period,
          club_name: club.name,
          user_id: u.user_id,
          user_name: u.user_name,
          role: u.role,
          roles: u.roles,
          last_login_date: addDays(period, -daysAgo),
          logins_30d: Math.max(0, Math.round((30 - daysAgo) * (0.4 + random() * 0.8))),
          reports_created_30d: Math.max(0, Math.round(10 * scale * (0.5 + random()))),
          searches_30d: Math.max(0, Math.round(25 * scale * (0.5 + random())))
        });
      });
    });
  });

  return { clubRows: clubRows, userRows: userRows };
}

function DarkTooltip(props) {
  var active = props.active;
  var payload = props.payload;
  var label = props.label;
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  return (
    <div style={{ background: '#141420', border: '1px solid #1e1e30', padding: '8px 10px', borderRadius: 8 }}>
      <div style={{ color: '#8888a0', fontSize: 12, marginBottom: 4 }}>{label}</div>
      {payload.map(function (p, i) {
        return (
          <div key={String(i)} style={{ color: p.color || '#ffffff', fontSize: 12 }}>
            {String(p.name) + ': ' + String(p.value)}
          </div>
        );
      })}
    </div>
  );
}

function App() {
  var initial = useMemo(function () {
    return generateSampleData();
  }, []);

  var stateClub = useState(initial.clubRows);
  var clubData = stateClub[0];
  var setClubData = stateClub[1];

  var stateUser = useState(initial.userRows);
  var userData = stateUser[0];
  var setUserData = stateUser[1];

  var selectedState = useState('FC Bayern Munich');
  var selectedClub = selectedState[0];
  var setSelectedClub = selectedState[1];

  var uploadState = useState(false);
  var showUpload = uploadState[0];
  var setShowUpload = uploadState[1];

  var trendState = useState(false);
  var showTrends = trendState[0];
  var setShowTrends = trendState[1];

  var messageState = useState('');
  var uploadMessage = messageState[0];
  var setUploadMessage = messageState[1];

  var latestDate = useMemo(function () {
    if (clubData.length === 0) {
      return '';
    }
    return clubData
      .map(function (r) {
        return r.upload_date;
      })
      .sort()
      .slice(-1)[0];
  }, [clubData]);

  var clubsLatest = useMemo(function () {
    var map = {};
    clubData.forEach(function (r) {
      if (r.upload_date === latestDate) {
        map[r.club_name] = r;
      }
    });
    return Object.keys(map)
      .map(function (name) {
        return map[name];
      })
      .sort(function (a, b) {
        return b.contract_seats - a.contract_seats;
      });
  }, [clubData, latestDate]);

  var tiersByClub = useMemo(function () {
    var result = {};
    clubsLatest.forEach(function (r, i) {
      result[r.club_name] = getTierLabel(i, clubsLatest.length);
    });
    return result;
  }, [clubsLatest]);

  var clubNames = useMemo(function () {
    var set = {};
    clubData.forEach(function (r) {
      set[r.club_name] = true;
    });
    return Object.keys(set).sort();
  }, [clubData]);

  var selectedHistory = useMemo(function () {
    return clubData
      .filter(function (r) {
        return r.club_name === selectedClub;
      })
      .sort(function (a, b) {
        return a.upload_date.localeCompare(b.upload_date);
      });
  }, [clubData, selectedClub]);

  var currentRow = selectedHistory.length > 0 ? selectedHistory[selectedHistory.length - 1] : null;
  var previousRows = selectedHistory.slice(Math.max(0, selectedHistory.length - 4), selectedHistory.length - 1);

  function avgPrev3(key) {
    if (previousRows.length === 0) {
      return 0;
    }
    var sum = 0;
    previousRows.forEach(function (r) {
      sum += r[key];
    });
    return Math.round(sum / previousRows.length);
  }

  function kpiInfo(title, icon, key) {
    var currentVal = currentRow ? currentRow[key] : 0;
    var avg = avgPrev3(key);
    var stdDev = stdDevFromRows(previousRows, key);
    var diffPct = avg === 0 ? 0 : ((currentVal - avg) / avg) * 100;
    var zScore = stdDev === 0 ? 0 : (currentVal - avg) / stdDev;
    var status = getStatusFromZScore(zScore, currentVal, avg, stdDev);
    return {
      title: title,
      icon: icon,
      key: key,
      current: currentVal,
      avg: avg,
      stdDev: stdDev,
      zScore: zScore,
      diffPct: diffPct,
      status: status
    };
  }

  var kpis = [
    kpiInfo('ACTIVE USERS', '👥', 'active_users'),
    kpiInfo('REPORTS CREATED', '📄', 'reports_created'),
    kpiInfo('SHORTLIST EDITS', '⭐', 'shortlist_edits'),
    kpiInfo('SEARCHES PERFORMED', '🔍', 'searches_performed')
  ];

  var latestUsers = useMemo(function () {
    return userData.filter(function (u) {
      return u.club_name === selectedClub && u.upload_date === latestDate;
    });
  }, [userData, selectedClub, latestDate]);

  var roleColumns = ['Admin', 'Scout', 'Squad Manager', 'Squad Planner', 'Club2Club'];

  var usersMissingScout = useMemo(function () {
    return latestUsers.filter(function (u) {
      var roles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : parseRoles(u.role, '');
      var hasScout = false;
      roles.forEach(function (r) {
        if (r === 'Scout') {
          hasScout = true;
        }
      });
      return !hasScout;
    });
  }, [latestUsers]);

  var inactiveUsers = useMemo(function () {
    return latestUsers
      .map(function (u) {
        var daysAgo = daysBetween(latestDate, u.last_login_date);
        return { item: u, daysAgo: daysAgo };
      })
      .filter(function (x) {
        return x.daysAgo >= 14;
      })
      .sort(function (a, b) {
        return b.daysAgo - a.daysAgo;
      });
  }, [latestUsers, latestDate]);

  var interventions = useMemo(function () {
    var list = [];
    var hasCritical = false;
    var hasWarning = false;
    kpis.forEach(function (k) {
      if (k.status === 'CRITICAL') {
        hasCritical = true;
        list.push({ type: 'CRITICAL', text: '🔴 ' + k.title + ' is more than 2σ below the previous 90d average.' });
      } else if (k.status === 'WARNING') {
        hasWarning = true;
        list.push({ type: 'WARNING', text: '🟡 ' + k.title + ' is between 1σ and 2σ below the previous 90d average.' });
      }
    });
    if (inactiveUsers.length > 0) {
      hasWarning = true;
      list.push({ type: 'WARNING', text: '🟡 ' + String(inactiveUsers.length) + ' user(s) have not logged in for 14+ days.' });
    }
    if (usersMissingScout.length > 0) {
      hasWarning = true;
      list.push({ type: 'WARNING', text: '🟡 ' + String(usersMissingScout.length) + ' user(s) are missing the mandatory Scout role.' });
    }
    if (currentRow && currentRow.data_conflicts_current > 10) {
      hasWarning = true;
      list.push({ type: 'WARNING', text: '🟡 ' + String(currentRow.data_conflicts_current) + ' open data conflicts detected.' });
    }
    if (list.length === 0) {
      list.push({ type: 'HEALTHY', text: '🟢 All metrics healthy.' });
    }
    return {
      borderColor: hasCritical ? '#ff4757' : hasWarning ? '#ffa502' : '#39FF14',
      items: list
    };
  }, [kpis, inactiveUsers, usersMissingScout, currentRow]);

  var tierAvg = useMemo(function () {
    if (!currentRow) {
      return null;
    }
    var tier = tiersByClub[selectedClub];
    var inTier = clubsLatest.filter(function (c) {
      return tiersByClub[c.club_name] === tier;
    });
    if (inTier.length === 0) {
      return null;
    }
    var keys = [
      'shortlists_usage',
      'scouting_status_usage',
      'appointments_created',
      'area_search_visits',
      'squad_planner_visits',
      'club2club_visits'
    ];
    var avg = {};
    keys.forEach(function (k) {
      var s = 0;
      inTier.forEach(function (r) {
        s += r[k];
      });
      avg[k] = Math.round(s / inTier.length);
    });
    return avg;
  }, [currentRow, tiersByClub, selectedClub, clubsLatest]);

  var benchmarkData = useMemo(function () {
    if (!currentRow || !tierAvg) {
      return [];
    }
    return [
      { category: 'Shortlists', club: currentRow.shortlists_usage, tier: tierAvg.shortlists_usage },
      { category: 'S. Status', club: currentRow.scouting_status_usage, tier: tierAvg.scouting_status_usage },
      { category: 'Appts', club: currentRow.appointments_created, tier: tierAvg.appointments_created },
      { category: 'Area Search', club: currentRow.area_search_visits, tier: tierAvg.area_search_visits },
      { category: 'Squad Planner', club: currentRow.squad_planner_visits, tier: tierAvg.squad_planner_visits },
      { category: 'Club2Club', club: currentRow.club2club_visits, tier: tierAvg.club2club_visits }
    ];
  }, [currentRow, tierAvg]);

  var personaData = useMemo(function () {
    var roleMap = { Admin: 0, Scout: 0, 'Squad Manager': 0, 'Squad Planner': 0, Club2Club: 0 };
    latestUsers.forEach(function (u) {
      var roles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : parseRoles(u.role, '');
      roles.forEach(function (roleName) {
        if (roleMap[roleName] !== undefined) {
          roleMap[roleName] += 1;
        }
      });
    });
    return [
      { name: 'Admin', value: roleMap.Admin, color: '#39FF14' },
      { name: 'Scout', value: roleMap.Scout, color: '#5dade2' },
      { name: 'Squad Manager', value: roleMap['Squad Manager'], color: '#ffa502' },
      { name: 'Squad Planner', value: roleMap['Squad Planner'], color: '#ff6b9d' },
      { name: 'Club2Club', value: roleMap.Club2Club, color: '#a29bfe' }
    ];
  }, [latestUsers]);

  var roleMatrixUsers = useMemo(function () {
    return latestUsers
      .map(function (u) {
        var roles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : parseRoles(u.role, '');
        var hasMap = {};
        roles.forEach(function (r) {
          hasMap[r] = true;
        });
        return {
          user_name: u.user_name,
          roles: roles,
          hasMap: hasMap,
          missingScout: !hasMap.Scout
        };
      })
      .sort(function (a, b) {
        return a.user_name.localeCompare(b.user_name);
      });
  }, [latestUsers]);

  function handleParsedUpload(kind, rows) {
    if (!rows || rows.length === 0) {
      setUploadMessage('❌ Upload failed: no data rows found.');
      return;
    }
    if (kind === 'club') {
      var normalized = rows.map(normalizeClubRow);
      setClubData(function (prev) {
        return prev.concat(normalized);
      });
      if (normalized.length > 0 && clubNames.indexOf(normalized[0].club_name) === -1) {
        setSelectedClub(normalized[0].club_name);
      }
      setUploadMessage('✅ Club CSV uploaded: ' + String(normalized.length) + ' rows appended.');
    } else {
      var normalizedUsers = rows.map(normalizeUserRow);
      setUserData(function (prev) {
        return prev.concat(normalizedUsers);
      });
      setUploadMessage('✅ User CSV uploaded: ' + String(normalizedUsers.length) + ' rows appended.');
    }
  }

  function readFile(file, kind) {
    if (!file || file.name.toLowerCase().indexOf('.csv') === -1) {
      setUploadMessage('❌ Please upload a valid .csv file.');
      return;
    }
    var reader = new FileReader();
    reader.onload = function (event) {
      try {
        var text = String(event.target.result || '');
        var parsed = parseCsv(text);
        handleParsedUpload(kind, parsed);
      } catch (e) {
        setUploadMessage('❌ CSV parse error: ' + String(e.message || e));
      }
    };
    reader.readAsText(file);
  }

  function resetAllData() {
    var ok = typeof window !== 'undefined' ? window.confirm('Reset all uploaded data and return to the default sample dataset?') : true;
    if (!ok) {
      return;
    }
    setClubData(initial.clubRows.slice());
    setUserData(initial.userRows.slice());
    setSelectedClub('FC Bayern Munich');
    setShowUpload(false);
    setShowTrends(false);
    setUploadMessage('✅ Data reset to default sample dataset.');
  }

  function uploadZone(title, kind) {
    return (
      <label
        style={{
          border: '1px dashed #39FF14',
          background: '#10101a',
          borderRadius: 12,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 120,
          cursor: 'pointer',
          color: '#ffffff'
        }}
        onDragOver={function (e) {
          e.preventDefault();
        }}
        onDrop={function (e) {
          e.preventDefault();
          var file = e.dataTransfer.files && e.dataTransfer.files[0];
          readFile(file, kind);
        }}
      >
        <div style={{ fontSize: 26, marginBottom: 6 }}>📁</div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
        <div style={{ color: '#8888a0', fontSize: 12 }}>Drag & drop or click to browse</div>
        <input
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={function (e) {
            var file = e.target.files && e.target.files[0];
            readFile(file, kind);
          }}
        />
      </label>
    );
  }

  var featureCounters = currentRow
    ? [
        { icon: '🎙️', label: 'Speech2Report', value: currentRow.speech2report_count },
        { icon: '📋', label: 'Lineup Detector', value: currentRow.lineup_detector_count },
        { icon: '🔔', label: 'Push Alerts', value: currentRow.push_alerts_sent },
        { icon: '✉️', label: 'Mail Alerts', value: currentRow.mail_alerts_sent },
        { icon: '📊', label: 'Custom Dashboards', value: currentRow.custom_dashboards_count }
      ]
    : [];

  var editorBars = currentRow
    ? [
        { label: 'Players Created', value: currentRow.players_created, color: '#39FF14' },
        { label: 'Teams Created', value: currentRow.teams_created, color: '#39FF14' },
        { label: 'Matches Created', value: currentRow.matches_created, color: '#39FF14' },
        { label: 'Data Conflicts Current', value: currentRow.data_conflicts_current, color: '#ff4757' },
        { label: 'Data Conflicts Resolved', value: currentRow.data_conflicts_resolved, color: '#39FF14' }
      ]
    : [];

  var maxEditor = 1;
  editorBars.forEach(function (b) {
    maxEditor = Math.max(maxEditor, b.value);
  });

  var footerStart = clubData.length > 0 ? clubData.map(function (r) { return r.upload_date; }).sort()[0] : '';
  var footerEnd = latestDate;

  return (

    <div style={{ background: '#0a0a0f', color: '#ffffff', minHeight: '100vh', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 1 }}>
            SC<span style={{ color: '#39FF14' }}>O</span>UTASTIC
          </div>
          <div style={{ color: '#8888a0', fontSize: 13 }}>CSM Performance Dashboard</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedClub}
            onChange={function (e) {
              setSelectedClub(e.target.value);
            }}
            style={{ background: '#141420', color: '#ffffff', border: '1px solid #1e1e30', borderRadius: 8, padding: '9px 10px' }}
          >
            {clubNames.map(function (name) {
              return (
                <option key={name} value={name}>
                  {name}
                </option>
              );
            })}
          </select>
          <button
            onClick={function () {
              setShowTrends(!showTrends);
            }}
            style={{
              border: '1px solid #39FF14',
              background: 'transparent',
              color: '#39FF14',
              borderRadius: 8,
              padding: '9px 10px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {showTrends ? 'HIDE TRENDS' : 'SHOW TRENDS'}
          </button>
          <button
            onClick={function () {
              setShowUpload(!showUpload);
            }}
            style={{ background: '#39FF14', color: '#000000', border: 'none', borderRadius: 8, padding: '10px 12px', fontWeight: 800, cursor: 'pointer' }}
          >
            UPLOAD DATA
          </button>
          <button
            onClick={resetAllData}
            style={{ background: '#2a2a3a', color: '#ffb3b3', border: '1px solid #ff4757', borderRadius: 8, padding: '9px 10px', fontWeight: 700, cursor: 'pointer' }}
          >
            RESET DATA
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 1 }}>{selectedClub.toUpperCase()}</div>
        <div style={{ color: '#8888a0' }}>
          {'Tier ' + String(tiersByClub[selectedClub] || '-') + ' · ' + String(currentRow ? currentRow.contract_seats : 0) + ' seats · Latest data: ' + latestDate}
        </div>
      </div>

      {showUpload && (
        <div style={{ background: '#141420', border: '1px solid #1e1e30', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>{uploadZone('Club Data CSV', 'club')}{uploadZone('User Data CSV', 'user')}</div>
          {uploadMessage ? <div style={{ marginTop: 10, color: uploadMessage.indexOf('✅') === 0 ? '#39FF14' : '#ff4757' }}>{uploadMessage}</div> : null}
        </div>
      )}

      <div style={{ borderLeft: '5px solid ' + interventions.borderColor, background: '#141420', border: '1px solid #1e1e30', borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>⚡ Strategic Interventions</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {interventions.items.map(function (it, i) {
            var bg = it.type === 'CRITICAL' ? 'rgba(255,71,87,0.16)' : it.type === 'WARNING' ? 'rgba(255,165,2,0.16)' : 'rgba(57,255,20,0.16)';
            return (
              <div key={String(i)} style={{ background: bg, border: '1px solid #1e1e30', borderRadius: 8, padding: '8px 10px' }}>
                {it.text}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
        {kpis.map(function (kpi) {
          return (
            <div key={kpi.key} style={{ background: '#141420', border: '1px solid #1e1e30', borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, color: '#8888a0', fontWeight: 700 }}>{kpi.title}</div>
                <div>{kpi.icon}</div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 900 }}>{kpi.current}</div>
              <div style={{ color: '#8888a0', fontSize: 12 }}>/ 90d: {kpi.avg}</div>
              <div style={{ marginTop: 6 }}>
                <span style={{ background: colorByStatus(kpi.status), color: '#0a0a0f', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 800 }}>{kpi.status}</span>
              </div>
              <div style={{ marginTop: 8, width: 80, height: 28 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedHistory}>
                    <Line type="monotone" dataKey={kpi.key} stroke={colorByStatus(kpi.status)} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {showTrends && (
        <div style={{ background: '#141420', border: '1px solid #1e1e30', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>📈 Historical Trends</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {[
              { title: 'Active Users', key: 'active_users', color: '#5dade2' },
              { title: 'Reports Created', key: 'reports_created', color: '#39FF14' },
              { title: 'Shortlist Edits', key: 'shortlist_edits', color: '#ffa502' },
              { title: 'Searches Performed', key: 'searches_performed', color: '#ff6b9d' }
            ].map(function (cfg) {
              return (
                <div key={cfg.key} style={{ background: '#10101a', border: '1px solid #1e1e30', borderRadius: 10, padding: 8 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{cfg.title}</div>
                  <div style={{ width: '100%', height: 140 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedHistory}>
                        <CartesianGrid stroke="#1e1e30" strokeDasharray="3 3" />
                        <XAxis dataKey="upload_date" tickFormatter={formatShortDate} stroke="#8888a0" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#8888a0" tick={{ fontSize: 11 }} />
                        <Tooltip content={<DarkTooltip />} />
                        <Line type="monotone" dataKey={cfg.key} stroke={cfg.color} strokeWidth={2} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ background: '#141420', border: '1px solid #1e1e30', borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Comparative Ecosystem Benchmarking</div>
        <div style={{ color: '#8888a0', marginBottom: 10 }}>{'Club vs Tier ' + String(tiersByClub[selectedClub] || '-') + ' Average'}</div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={benchmarkData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" />
              <XAxis dataKey="category" stroke="#8888a0" tick={{ fontSize: 11 }} />
              <YAxis stroke="#8888a0" tick={{ fontSize: 11 }} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="club" fill="#5dade2" name="Club" />
              <Bar dataKey="tier" fill="#39FF14" name="Tier Avg" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#141420', border: '1px solid #1e1e30', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Feature Counters</div>
          {featureCounters.map(function (f, i) {
            return (
              <div key={String(i)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i === featureCounters.length - 1 ? 'none' : '1px solid #1e1e30' }}>
                <span>{f.icon + ' ' + f.label}</span>
                <span style={{ fontWeight: 700 }}>{f.value}</span>
              </div>
            );
          })}
        </div>

        <div style={{ background: '#141420', border: '1px solid #1e1e30', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Editor Output & Maintenance</div>
          {editorBars.map(function (b, i) {
            var widthPct = Math.round((b.value / maxEditor) * 100);
            return (
              <div key={String(i)} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>{b.label}</span>
                  <span>{b.value}</span>
                </div>
                <div style={{ height: 10, background: '#0a0a0f', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: String(widthPct) + '%', background: b.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12, marginBottom: 18 }}>
        <div style={{ background: '#141420', border: '1px solid #1e1e30', borderRadius: 12, padding: 14, display: 'grid', gridTemplateColumns: '1fr 180px', gap: 8 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>User Role Matrix</div>
            <div style={{ color: '#8888a0', fontSize: 12, marginBottom: 8 }}>● = role assigned</div>
            <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #1e1e30', borderRadius: 8, marginBottom: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#10101a', color: '#8888a0' }}>
                    <th style={{ textAlign: 'left', padding: 6 }}>User</th>
                    {roleColumns.map(function (roleName, i) {
                      return (
                        <th key={String(i)} style={{ textAlign: 'center', padding: 6 }}>{roleName}</th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {roleMatrixUsers.map(function (u, rowIdx) {
                    return (
                      <tr key={String(rowIdx)} style={{ borderTop: '1px solid #1e1e30' }}>
                        <td style={{ padding: 6 }}>{u.user_name}</td>
                        {roleColumns.map(function (roleName, colIdx) {
                          var hasRole = !!u.hasMap[roleName];
                          var scoutMissingAlert = roleName === 'Scout' && u.missingScout;
                          return (
                            <td key={String(colIdx)} style={{ textAlign: 'center', padding: 6, color: scoutMissingAlert ? '#ff4757' : '#39FF14', fontWeight: 800 }}>
                              {scoutMissingAlert ? '⚠️' : hasRole ? '●' : ''}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Persona Seat Allocation</div>
            {personaData.map(function (p, i) {
              return (
                <div key={String(i)} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: '#ddddf0' }}>
                  <span>{p.name}</span>
                  <span>{p.value}</span>
                </div>
              );
            })}
          </div>
          <div style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={personaData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {personaData.map(function (entry, i) {
                    return <Cell key={String(i)} fill={entry.color} />;
                  })}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: '#141420', border: '1px solid #1e1e30', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>⚠️ Inactive Users (14+ days)</div>
          <div style={{ color: '#8888a0', marginBottom: 8 }}>{String(inactiveUsers.length) + ' flagged users'}</div>
          {inactiveUsers.length === 0 ? (
            <div style={{ color: '#39FF14' }}>✅ All users active within the last 14 days.</div>
          ) : (
            <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #1e1e30', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#10101a', color: '#8888a0' }}>
                    <th style={{ textAlign: 'left', padding: 6 }}>User</th>
                    <th style={{ textAlign: 'left', padding: 6 }}>Roles</th>
                    <th style={{ textAlign: 'left', padding: 6 }}>Last Login</th>
                    <th style={{ textAlign: 'left', padding: 6 }}>Days Ago</th>
                  </tr>
                </thead>
                <tbody>
                  {inactiveUsers.map(function (x, i) {
                    return (
                      <tr key={String(i)} style={{ borderTop: '1px solid #1e1e30' }}>
                        <td style={{ padding: 6 }}>{x.item.user_name}</td>
                        <td style={{ padding: 6 }}>{(x.item.roles && x.item.roles.length > 0 ? x.item.roles : [x.item.role]).join(', ')}</td>
                        <td style={{ padding: 6 }}>{x.item.last_login_date}</td>
                        <td style={{ padding: 6, color: x.daysAgo >= 21 ? '#ff4757' : '#ffa502', fontWeight: 700 }}>{x.daysAgo}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', color: '#8888a0', fontSize: 13, paddingBottom: 8 }}>
        <span>SC<span style={{ color: '#39FF14' }}>O</span>UTASTIC CSM Dashboard · Data period: {footerStart + ' → ' + footerEnd + ' · ' + String(clubNames.length) + ' clubs tracked'}</span>
      </div>
    </div>
  );
}

export default App;
