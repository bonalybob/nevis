'use strict'

// The Vue instance for live view of entries
const entriesVue = new Vue({
    el: '#entries-search',
    data: {
        name: '',
        siid: '',
        course: '',
        sortBy: 'name',
        data: '',
        courses: '',
    },
    computed: {
        entries: function () {
            if (this.data !== '' && this.data !== null) {
                return this.data.chain()
                    .find({
                        'name': { '$contains': this.name },
                        'siid': { '$contains': this.siid },
                        'course': { '$contains': this.course },
                    })
                    .simplesort(this.sortBy)
                    .data()
            }
            else {
                return {}
            }
        },
    },
})

// Basic Entry functions add, update, delete
function addEntry () {
    entryInfo('blank')
    if (document.getElementById('entries-add-name').value === '' && document.getElementById('entries-add-siid').value === '') {
        entryInfo('error', ' Error: No SI Card or Name specified for Entry ')
    }
    else {
        try {
            competitorsDB.insert({
                name: document.getElementById('entries-add-name').value,
                siid: document.getElementById('entries-add-siid').value,
                membershipNumber: document.getElementById('entries-add-membership-number').value,
                ageClass: document.getElementById('entries-add-age-class').value.toUpperCase(),
                club: document.getElementById('entries-add-club').value.toUpperCase(),
                nonCompetitive: document.getElementById('entries-add-non-competitive').checked,
                course: document.getElementById('entries-add-course').value,
                download: null,
            })
            db.saveDatabase()
            blankEntry()
        }
        catch (error) {
            entryInfo('error', ' Error: An entry already exists for this SI Card ')
        }
    }
}

function updateEntry () {
    entryInfo('blank')
    if (document.getElementById('entries-add-name').value === '' && document.getElementById('entries-add-siid').value === '') {
        entryInfo('info', ' Error: No SI Card or Name specified for Entry ')
    }
    else {
        try {
            let entryToUpdate = competitorsDB.findOne({ $loki: parseInt(document.getElementById('entries-add-id').value) })
            const inputedCourse = document.getElementById('entries-add-course').value
            if ((entryToUpdate.download && entryToUpdate.course === inputedCourse) || entryToUpdate.download === null) {
                entryToUpdate.name = document.getElementById('entries-add-name').value
                entryToUpdate.siid = document.getElementById('entries-add-siid').value
                entryToUpdate.club = document.getElementById('entries-add-club').value
                entryToUpdate.membershipNumber = document.getElementById('entries-add-membership-number').value
                entryToUpdate.ageClass = document.getElementById('entries-add-age-class').value
                entryToUpdate.nonCompetitive = document.getElementById('entries-add-non-competitive').checked
                entryToUpdate.course = inputedCourse
                competitorsDB.update(entryToUpdate)
                db.saveDatabase()
                blankEntry()
                navigatePage('Entries')
                document.getElementById('entries-add-id').value = ''
            }
            else {
                if (inputedCourse === '') {
                    entryToUpdate.download.totalTime = entryToUpdate.download.finish - entryToUpdate.download.start
                }
                else {
                    const courseComplete = checkCourse(entryToUpdate.download.controls, coursesDB.findOne({ name: inputedCourse }).controls)
                    if (courseComplete[1] !== '') {
                        entryToUpdate.download.totalTime = courseComplete[1]
                    }
                }
                entryToUpdate.name = document.getElementById('entries-add-name').value
                entryToUpdate.siid = document.getElementById('entries-add-siid').value
                entryToUpdate.club = document.getElementById('entries-add-club').value
                entryToUpdate.membershipNumber = document.getElementById('entries-add-membership-number').value
                entryToUpdate.ageClass = document.getElementById('entries-add-age-class').value
                entryToUpdate.nonCompetitive = document.getElementById('entries-add-non-competitive').checked
                entryToUpdate.course = inputedCourse
                competitorsDB.update(entryToUpdate)
                db.saveDatabase()
                blankEntry()
                navigatePage('Entries')
                document.getElementById('entries-add-id').value = ''
            }
        }
        catch (error) {
            entryInfo('error', ' Error: An entry already exists for this SI Card ')
        }
    }
}

function deleteEntry () {
    dialogs.openConfirmDialog('Nevis - Delete Entry', 'Are you sure you want to Delete this Entry?', 'Delete', 'Cancel').then((state) => {
        if (state) {
            competitorsDB.removeWhere({ $loki: parseInt(document.getElementById('entries-add-id').value) })
            db.saveDatabase()
            blankEntry()
            navigatePage('Entries')
            entryInfo('info', ' Entry Deleted')
            document.getElementById('entries-add-id').value = ''
        }
    })
}

function deleteAllEntries () {
    dialogs.openConfirmDialog('Nevis - Delete All Entries', 'Are you sure you want to Delete All Entries?', 'Delete All', 'Cancel').then((state) => {
        if (state) {
            competitorsDB.chain().find().remove()
            db.saveDatabase()
            entryInfo('info', 'All Entries Deleted')
        }
    })
}

// Import the entries from a file
function importXMLEntries () {
    entryInfo('blank')
    dialog.showOpenDialog({
        title: 'Nevis - Import Entries',
        filters: [
            { name: 'IOF XML 3.0', extensions: ['xml'] },
            { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile'],
    }, function (paths) {
        if (paths) {
            fs.exists(paths[0], function (exists) {
                if (exists) {
                    try {
                        parseXML(fs.readFileSync(paths[0], 'utf8'), function (error, result) {
                            let errorMessage = ''
                            let errorCounter = 0
                            let blankSiidCounter = 1
                            let xmlCourses = []
                            for (let entry of result.EntryList.PersonEntry) {
                                const competitor = {
                                    name: entry.Person[0].Name[0].Given + ' ' + entry.Person[0].Name[0].Family,
                                    membershipNumber: entry.Person[0].Id,
                                    ageClass: '',
                                    club: '',
                                    nonCompetitive: false,
                                    course: entry.Class[0].Name[0],
                                    download: null,
                                }
                                if (entry.ControlCard) {
                                    competitor.siid = entry.ControlCard[0]
                                }
                                else {
                                    competitor.siid = blankSiidCounter.toString()
                                    blankSiidCounter = blankSiidCounter + 1
                                    entryInfo('warning', 'Warning: No SI Card specified for ' + competitor.name + ', a Random Value has been Generated')
                                }
                                if (entry.Organisation) competitor.club = entry.Organisation[0].Name
                                try {
                                    competitorsDB.insert(competitor)
                                }
                                catch (err) {
                                    entryInfo('error', 'Error: SI Card - ' + competitor.siid + ' already assigned')
                                    errorCounter = errorCounter - 1
                                }
                                if (!xmlCourses[competitor.course]) xmlCourses.push(competitor.course)
                            }
                            db.saveDatabase()
                            entryInfo('info', ' ' + String(result.EntryList.PersonEntry.length + errorCounter) + ' Entries Imported from XML')
                            if (errorMessage !== '') entryInfo('error', error)
                            let warning = ''
                            for (let course of xmlCourses) {
                                if (coursesDB.findOne({ 'course': course }) === null) entryInfo('warning', 'Warning: No course called ' + course + ' exists')
                            }
                        })
                    }
                    catch (error) {
                        entryInfo('error', 'Error: Invalid File Format')
                    }
                }
            })
        }
    })
}

// Navigate between add entries and update and refresh the data
function blankEntry () {
    document.getElementById('entries-add-name').value = ''
    document.getElementById('entries-add-siid').value = ''
    document.getElementById('entries-add-membership-number').value = ''
    document.getElementById('entries-add-age-class').value = ''
    document.getElementById('entries-add-club').value = ''
    document.getElementById('entries-add-course').value = ''
    document.getElementById('entries-add-non-competitive').checked = false
    document.getElementById('entries-add-id').value = ''
}

function entryLink (id) {
    blankEntry()
    navigatePage('Entries/Update')
    let linkedEntry = competitorsDB.findOne({ $loki: parseInt(id) })
    document.getElementById('entries-add-id').value = id
    document.getElementById('entries-add-name').value = linkedEntry.name
    document.getElementById('entries-add-siid').value = linkedEntry.siid
    document.getElementById('entries-add-membership-number').value = linkedEntry.membershipNumber
    document.getElementById('entries-add-age-class').value = linkedEntry.ageClass
    document.getElementById('entries-add-club').value = linkedEntry.club
    document.getElementById('entries-add-course').value = linkedEntry.course
    document.getElementById('entries-add-non-competitive').checked = linkedEntry.nonCompetitive
    if (linkedEntry.download) {
        document.getElementById('entries-download-data').setAttribute('style', 'display:block')
        document.getElementById('entries-download-data').innerHTML = `
            <h1>Time: ${readableTimeElapsed(linkedEntry.download.totalTime)}</h1>
            <p>Start: ${readableTime(linkedEntry.download.start)}</p>
            <p>Finish: ${readableTime(linkedEntry.download.finish)}</p>
            <p>Controls: ${linkedEntry.download.controls.map((control, i) => control.code)}</p>
        `
    }
}

// Logic for the info dialog and refresh of the courses list
function entryInfo (type, message) {
    if (type === 'blank') {
        document.getElementById('entries-info').innerHTML = ''
        hideEntryInfo()
    }
    else {
        document.getElementById('entries-info').innerHTML = document.getElementById('entries-info').innerHTML + '<p class=\'' + type + '\'>' + message + '</p>'
        document.getElementById('entries-info').setAttribute('style', 'display:block')
        if (type === 'error') document.getElementById('entries-info').setAttribute('class', 'card error')
        else if (type === 'warning') document.getElementById('entries-info').setAttribute('class', 'card warning')
        else document.getElementById('entries-info').setAttribute('class', 'card info')
    }
}

function hideEntryInfo () {
    document.getElementById('entries-info').setAttribute('style', 'display:none')
}

function entriesAddCourseDropdownRefresh () {
    const originalValue = document.getElementById('entries-add-course').value
    const originalValueSearch = document.getElementById('entries-search-course').value
    const allCourses = coursesDB.find()
    let innerHTML = '<option></option>'
    for (let course of allCourses) {
        innerHTML = innerHTML + `<option value='${course.name}'>${course.name}</option>`
    }
    document.getElementById('entries-add-course').innerHTML = innerHTML
    document.getElementById('entries-add-course').value = originalValue
    document.getElementById('entries-search-course').innerHTML = innerHTML
    document.getElementById('entries-search-course').value = originalValueSearch
}