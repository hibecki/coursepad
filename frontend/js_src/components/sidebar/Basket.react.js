/**
 * @jsx React.DOM
 */
var schedules = require('../../store/schedules.js');

var ana = require('../../analytics/analytics.js');

var SelectionIndicator = React.createClass({
    render: function() {
        return <div className={'selected-indicator' + (this.props['selected'] ? ' selected' : '') + (this.props.action && !this.props['selected'] ? ' selectable' : '')} onClick={this.props['selected'] ? null : this.props.action}> </div>
    }
});

var Basket = React.createClass({
    componentWillMount: function() {
        schedules.on('readystatechange', this._onReadyStateChange);
        schedules.on('change', this._update);

    },
    componentDidUnmount: function() {
        schedules.off('readystatechange', this._onReadyStateChange);
        schedules.off('change', this._update);

    },

    _onReadyStateChange: function() {
        if (schedules.ready) {
            this._update();
        } else {
            this.setState(this.getInitialState());
        }
    },

    _update: function() {
        this.setState({clusters: schedules.getCurrentSchedule().basket,
                       sections: schedules.getCurrentSchedule().sections,
                       hidden: schedules.getCurrentSchedule().hidden});
    },

    getInitialState: function() {
        return {clusters: [], sections: [], hidden: {}, expansion: {}};
    },

    _toggleExpansion: function(identifier) {
        var expansionState = this.state['expansion'];
        expansionState[identifier] = !expansionState[identifier];
        this.setState({expansion: expansionState});

        ana.sevent('basket', 'toggle_expansion', identifier);
    },

    _toggleVisibility: function(courseNumber) {
        schedules.getCurrentSchedule().toggleVisibility(courseNumber);
    },

    _changeSectionTo: function(sectionId) {
        schedules.getCurrentSchedule().changeSection(sectionId);

        ana.sevent('course', 'change_section_basket_dot', sectionId);
    },

    _changeCourseTo: function(course) {
        schedules.getCurrentSchedule().changeCourse(course);

        ana.sevent('course', 'change_course_basket_dot', course);
    },


    render: function() {
        var self = this;
        var clusters = null;
        var currentSchedule = schedules.getCurrentSchedule();
        if (currentSchedule) {
            var selectedSections = currentSchedule.getSelectedSectionIdsHash();
            var selectedCourses = currentSchedule.getSelectedCourseIdsHash();

            clusters = this.state.clusters.map(function(cluster) {
                var number = cluster[0].getNumber();
                var clusterItems = null;
                var className = currentSchedule.getColorForCourse(cluster[0].subject, cluster[0].number);

                var clusterVisible = !this.state.hidden[number];

                if (!clusterVisible) {
                    className += ' invisible';
                }

                function listOfSections(sections) {
                    return sections.map(function(section) {
                        return <div className="content level-2"><SelectionIndicator selected={selectedSections[section.number]} action={self._changeSectionTo.bind(null, section.number)} />{section.type + ' ' + section.sec}</div>
                    }, this);
                }

                if (this.state['expansion'][number]) {
                    if (cluster.length === 1) {
                        var sections = cluster[0].getAllSections();
                        clusterItems = listOfSections(sections);

                    } else {
                        clusterItems = cluster.map(function(course) {
                            var sections = course.getAllSections();
                            var sectionsDom = null;
                            if (sections.length > 1) {
                                sectionsDom = listOfSections(sections);
                            }
                            return <div className="content level-2"><SelectionIndicator selected={selectedCourses[course.id]} action={self._changeCourseTo.bind(null, course)} />{course.subject + ' ' + course.number}{sectionsDom}</div>

                        });

                    }
                }

                return <div className={"basket-item " + className}>
                    <div className="content">
                        <div className="content-buttons"><div aria-role="button" className={"btn visibility-btn" + (clusterVisible ? '' : ' closed')} onClick={this._toggleVisibility.bind(null, number)}></div> <div aria-role="button" className={"btn expand-btn" + (this.state.expansion[number] ? ' expanded' : '')} onClick={this._toggleExpansion.bind(null, number)}></div></div>
                    <div className="content-title">{number + ": "}{cluster[0].title}</div>
                    </div>
                    {clusterItems}
                </div> 

            }, this);
        }


        return <div className="basket utilities-item">
            <h2>Basket</h2>
        {clusters}
        </div>
    }
});

module.exports = Basket;