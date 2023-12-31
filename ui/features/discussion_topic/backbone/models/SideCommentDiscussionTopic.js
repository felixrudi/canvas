//
// Copyright (C) 2012 - present Instructure, Inc.
//
// This file is part of Canvas.
//
// Canvas is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero General Public License as published by the Free
// Software Foundation, version 3 of the License.
//
// Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
// WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
// A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
// details.
//
// You should have received a copy of the GNU Affero General Public License along
// with this program. If not, see <http://www.gnu.org/licenses/>.

import MaterializedDiscussionTopic from './Topic'

export default class SideCommentDiscussionTopic extends MaterializedDiscussionTopic {
  // #
  // restructures `@data.entries` so all ancestors become children of root
  // entries, sorted by creation date as they would have been in the first
  // place if the discussion had never been threaded, allows seemless
  // transitioning from threaded to side-comment
  parse() {
    super.parse(...arguments)

    for (const entry of this.data.entries) {
      entry.replies = []
    }

    for (const id in this.flattened) {
      const entry = this.flattened[id]
      if (entry.root_entry_id) {
        delete entry.replies
        const parent = this.flattened[entry.root_entry_id]
        parent.replies.push(entry)
        entry.parent = parent
        entry.parent_id = parent.id
      }
    }

    for (const entry of this.data.entries) {
      entry.replies.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    }

    return this.data
  }
}
